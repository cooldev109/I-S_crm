import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, MessageDirection, Budget, BudgetStatus } from '@prisma/client';
import { BudgetChapter, EventType, ParsedIntakeMessage } from '@studio/shared';
import { PrismaService } from '../../core/prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { ClientsService } from '../clients/clients.service';
import { ProjectsService } from '../projects/projects.service';
import { BudgetsService } from '../budgets/budgets.service';
import { parseAdjustment, ADJUSTMENT_HELP } from '../budgets/parsers/adjustment-parser';
import { WHATSAPP_PROVIDER, WhatsappProvider } from './providers/whatsapp-provider';
import {
  isCancellation,
  isConfirmation,
  parseIntake,
  summarise,
} from './parsers/intake-parser';

/**
 * Orchestrator for inbound WhatsApp messages. Two stateful conversations
 * supported, both following the confirm-before-act rule:
 *
 *   INTAKE       studio sends intake -> bot summary -> "sí" -> client+project
 *                 (pending stored in PendingIntake table)
 *
 *   BUDGET       project created -> bot auto-generates v1 -> bot sends summary
 *                 -> studio replies with adjustments / "aprobar" / "regenerar"
 *                 (state derived from latest DRAFT/UNDER_REVIEW budget for the
 *                  project whose originWaNumber matches the sender)
 *
 * Adjustment commands always win over the intake "sí/no" interpretation —
 * we only re-check the latter when no budget is in review.
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly clients: ClientsService,
    private readonly projects: ProjectsService,
    private readonly budgets: BudgetsService,
    @Inject(WHATSAPP_PROVIDER) private readonly provider: WhatsappProvider,
  ) {}

  /**
   * Single entry point for any inbound message — webhook and /simulate both
   * call this. `from` is the sender's WhatsApp number in E.164.
   */
  async handleInbound(from: string, body: string, rawPayload?: unknown): Promise<void> {
    await this.storeMessage(from, body, MessageDirection.INBOUND, rawPayload);
    await this.events.record({
      type: EventType.WHATSAPP_RECEIVED,
      payload: { from, body },
    });

    const text = body.trim();

    // A budget under review takes priority over intake/confirmation parsing.
    const budgetInReview = await this.budgets.findInReviewByWaNumber(from);
    if (budgetInReview) {
      const adj = parseAdjustment(text);
      if (adj) {
        await this.applyBudgetAdjustment(from, budgetInReview.projectId, adj);
        return;
      }
      // Don't fall through to intake parsing — the studio is in a review session.
      await this.reply(from, `No te he entendido en la revisión.\n\n${ADJUSTMENT_HELP}`);
      return;
    }

    if (isConfirmation(text)) {
      await this.tryConfirmIntake(from);
      return;
    }
    if (isCancellation(text)) {
      await this.tryCancelIntake(from);
      return;
    }

    const parsed = parseIntake(text);
    if (parsed) {
      await this.stagePending(from, parsed);
      return;
    }

    await this.reply(from, INTAKE_HELP);
  }

  // ---------- intake ----------

  private async stagePending(from: string, parsed: ParsedIntakeMessage): Promise<void> {
    await this.prisma.pendingIntake.upsert({
      where: { waNumber: from },
      create: { waNumber: from, parsed: parsed as unknown as Prisma.InputJsonValue },
      update: { parsed: parsed as unknown as Prisma.InputJsonValue },
    });
    await this.reply(
      from,
      `He entendido:\n${summarise(parsed)}\n\nResponde "sí" para crear o "no" para cancelar.`,
    );
  }

  private async tryConfirmIntake(from: string): Promise<void> {
    const pending = await this.prisma.pendingIntake.findUnique({ where: { waNumber: from } });
    if (!pending) {
      await this.reply(from, 'No tengo nada pendiente de confirmar.');
      return;
    }
    const parsed = pending.parsed as unknown as ParsedIntakeMessage;

    const client = await this.clients.create({
      name: parsed.clientName,
      contact: parsed.contact,
      source: 'whatsapp',
    });
    const project = await this.projects.create({
      clientId: client.id,
      type: parsed.projectType,
      areaM2: parsed.areaM2 ?? undefined,
      scope: parsed.scope ?? undefined,
      originWaNumber: from,
    });

    await this.prisma.pendingIntake.delete({ where: { waNumber: from } });
    await this.reply(
      from,
      `Creado ✅\nCliente: ${client.name} (id ${client.id.slice(-6)})\n` +
        `Proyecto: ${project.id.slice(-6)} (${project.type})\n\n` +
        `Generando presupuesto…`,
    );

    // Auto-generate v1 of the budget. Done inline (not via job queue) for Week 2
    // so the studio sees the summary in their next message — fine for rule-based
    // gen which is fast. Phase 1.1 Week 3 (AI layer) moves this to BullMQ.
    try {
      const budget = await this.budgets.generateForProject(project.id);
      await this.reply(from, this.formatBudgetSummary(budget));
    } catch (err) {
      this.logger.error(
        'Auto budget generation failed',
        err instanceof Error ? err.stack : String(err),
      );
      await this.reply(from, 'No pude generar el presupuesto automáticamente. Inténtalo manualmente.');
    }
  }

  private async tryCancelIntake(from: string): Promise<void> {
    const pending = await this.prisma.pendingIntake.findUnique({ where: { waNumber: from } });
    if (!pending) {
      await this.reply(from, 'Nada que cancelar.');
      return;
    }
    await this.prisma.pendingIntake.delete({ where: { waNumber: from } });
    await this.reply(from, 'Cancelado.');
  }

  // ---------- budget review ----------

  private async applyBudgetAdjustment(
    from: string,
    projectId: string,
    adj: ReturnType<typeof parseAdjustment>,
  ): Promise<void> {
    if (!adj) return;
    try {
      if (adj.kind === 'refine') {
        // refine has a richer reply (includes the AI notes / no-op explanation)
        const r = await this.budgets.refineForProject(projectId);
        const lead = r.usedAi ? 'Refinado por IA ✨' : 'IA no aplicada';
        await this.reply(from, `${lead}\n${r.notes}\n\n${this.formatBudgetSummary(r.budget)}`);
        return;
      }
      const next = await this.budgets.applyAdjustment(projectId, adj);
      if (adj.kind === 'approve') {
        await this.reply(
          from,
          `Presupuesto v${next.version} aprobado ✅\n` +
            `PEM €${fmt(next.pemTotal)} · Honorarios €${fmt(next.feeAmount)} · ` +
            `Base €${fmt(next.taxBaseTotal)}`,
        );
      } else {
        await this.reply(from, this.formatBudgetSummary(next));
      }
    } catch (err) {
      this.logger.error(
        `Adjustment failed: ${adj.kind}`,
        err instanceof Error ? err.stack : String(err),
      );
      await this.reply(
        from,
        err instanceof Error ? err.message : 'No pude aplicar el ajuste.',
      );
    }
  }

  private formatBudgetSummary(budget: Budget): string {
    const chapters = budget.chapters as unknown as BudgetChapter[];
    const head =
      `Presupuesto v${budget.version} (${budget.status === BudgetStatus.APPROVED ? 'aprobado' : 'borrador'})\n` +
      `PEM €${fmt(budget.pemTotal)} · Honorarios €${fmt(budget.feeAmount)} · ` +
      `Base €${fmt(budget.taxBaseTotal)}\n` +
      `Capítulos: ${chapters.length}, partidas: ${chapters.reduce((n, c) => n + c.items.length, 0)}\n`;
    const help =
      budget.status === BudgetStatus.APPROVED ? '' : `\nResponde con ajustes, "aprobar", o "regenerar".`;
    return head + help;
  }

  // ---------- shared ----------

  private async reply(toE164: string, body: string): Promise<void> {
    try {
      await this.provider.sendText(toE164, body);
    } catch (err) {
      this.logger.error(
        `Outbound reply failed (${this.provider.name})`,
        err instanceof Error ? err.stack : String(err),
      );
    }
    await this.storeMessage(toE164, body, MessageDirection.OUTBOUND);
    await this.events.record({
      type: EventType.WHATSAPP_SENT,
      payload: { to: toE164, body },
    });
  }

  private storeMessage(
    waNumber: string,
    body: string,
    direction: MessageDirection,
    rawPayload?: unknown,
  ) {
    return this.prisma.message.create({
      data: {
        waNumber,
        body,
        direction,
        rawPayload:
          rawPayload === undefined ? Prisma.JsonNull : (rawPayload as Prisma.InputJsonValue),
      },
    });
  }
}

const INTAKE_HELP =
  'No te he entendido. Para crear un proyecto envía:\n' +
  'nuevo proyecto\n' +
  'cliente: <nombre>\n' +
  'contacto: <tel/email>\n' +
  'tipo: integral | parcial | interiorismo | estudio\n' +
  'm2: <opcional>\n' +
  'alcance: <opcional>';

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
