import { Injectable, NotFoundException } from '@nestjs/common';
import { Budget, BudgetStatus, Prisma } from '@prisma/client';
import {
  BudgetChapter,
  BudgetDto,
  BudgetItem,
  EventType,
  ProjectType,
} from '@studio/shared';
import { PrismaService } from '../../core/prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { ProjectsService } from '../projects/projects.service';
import { BudgetRefinerService } from '../ai/budget-refiner.service';
import { BudgetGeneratorService } from './generator/budget-generator.service';
import { Adjustment } from './parsers/adjustment-parser';

@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly projects: ProjectsService,
    private readonly generator: BudgetGeneratorService,
    private readonly refiner: BudgetRefinerService,
  ) {}

  /**
   * Generate v1 of a project's budget (or v_n+1 if regenerating). Always
   * creates a new DRAFT row — we keep the history.
   */
  async generateForProject(projectId: string): Promise<Budget> {
    const project = await this.projects.findOne(projectId);
    const { chapters, totals } = this.generator.generate({
      type: project.type as ProjectType,
      areaM2: project.areaM2,
      scope: project.scope,
    });
    const version = (await this.maxVersion(projectId)) + 1;

    const budget = await this.prisma.budget.create({
      data: {
        projectId,
        version,
        status: BudgetStatus.DRAFT,
        chapters: chapters as unknown as Prisma.InputJsonValue,
        pemTotal: totals.pemTotal,
        feePercent: totals.feePercent,
        feeMinAmount: totals.feeMinAmount,
        feeAmount: totals.feeAmount,
        taxBaseTotal: totals.taxBaseTotal,
      },
    });
    await this.events.record({
      type: EventType.BUDGET_GENERATED,
      projectId,
      payload: { budgetId: budget.id, version, pemTotal: totals.pemTotal },
    });
    return budget;
  }

  /**
   * Send the latest draft through the AI refiner. Always returns a new
   * version, even if the AI made no changes (so the studio sees an audit
   * trail entry and a clear "no changes" reply). When OPENAI_API_KEY is
   * not configured, this collapses to a no-op and produces an identical
   * version with an explanatory note.
   */
  async refineForProject(projectId: string): Promise<{ budget: Budget; usedAi: boolean; notes: string }> {
    const project = await this.projects.findOne(projectId);
    const latest = await this.requireLatestDraft(projectId);
    const chapters = latest.chapters as unknown as BudgetChapter[];

    const result = await this.refiner.refine({
      projectType: project.type as ProjectType,
      areaM2: project.areaM2,
      scope: project.scope,
      chapters,
    });

    const totals = this.generator.recomputeTotals(result.refined);
    const version = latest.version + 1;
    const refined = await this.prisma.budget.create({
      data: {
        projectId,
        version,
        status: BudgetStatus.UNDER_REVIEW,
        chapters: result.refined as unknown as Prisma.InputJsonValue,
        pemTotal: totals.pemTotal,
        feePercent: totals.feePercent,
        feeMinAmount: totals.feeMinAmount,
        feeAmount: totals.feeAmount,
        taxBaseTotal: totals.taxBaseTotal,
        notes: result.notes,
      },
    });
    await this.events.record({
      type: EventType.BUDGET_REVISED,
      projectId,
      payload: { budgetId: refined.id, version, refinedByAi: result.usedAi, notes: result.notes },
    });
    return { budget: refined, usedAi: result.usedAi, notes: result.notes };
  }

  /** Apply a single adjustment to the latest DRAFT, creating a new version. */
  async applyAdjustment(projectId: string, adj: Adjustment): Promise<Budget> {
    if (adj.kind === 'approve') return this.approve(projectId);
    if (adj.kind === 'regenerate') return this.generateForProject(projectId);
    if (adj.kind === 'refine') return (await this.refineForProject(projectId)).budget;

    const latest = await this.requireLatestDraft(projectId);
    const chapters = (latest.chapters as unknown as BudgetChapter[]).map((c) => ({
      ...c,
      items: c.items.map((i) => ({ ...i })),
    }));

    const target = findItem(chapters, adj.itemCode);
    if (!target && adj.kind !== 'remove') {
      throw new NotFoundException(`Item ${adj.itemCode} not found in current budget`);
    }

    switch (adj.kind) {
      case 'setPrice':
        if (!target) throw new NotFoundException(`Item ${adj.itemCode} not found`);
        target.unitPrice = adj.unitPrice;
        target.total = round2(target.quantity * target.unitPrice);
        break;
      case 'setQuantity':
        if (!target) throw new NotFoundException(`Item ${adj.itemCode} not found`);
        target.quantity = adj.quantity;
        target.total = round2(target.quantity * target.unitPrice);
        break;
      case 'remove':
        for (const c of chapters) {
          c.items = c.items.filter((i) => i.code !== adj.itemCode);
        }
        break;
    }

    // Drop empty chapters after removals.
    const trimmed = chapters.filter((c) => c.items.length > 0);
    const totals = this.generator.recomputeTotals(trimmed);

    const version = latest.version + 1;
    const next = await this.prisma.budget.create({
      data: {
        projectId,
        version,
        status: BudgetStatus.UNDER_REVIEW,
        chapters: trimmed as unknown as Prisma.InputJsonValue,
        pemTotal: totals.pemTotal,
        feePercent: totals.feePercent,
        feeMinAmount: totals.feeMinAmount,
        feeAmount: totals.feeAmount,
        taxBaseTotal: totals.taxBaseTotal,
      },
    });
    await this.events.record({
      type: EventType.BUDGET_REVISED,
      projectId,
      payload: { budgetId: next.id, version, adjustment: adj as unknown as Prisma.InputJsonValue },
    });
    return next;
  }

  /** Find the most recent DRAFT/UNDER_REVIEW budget for a given WA number. */
  async findInReviewByWaNumber(waNumber: string): Promise<Budget | null> {
    const project = await this.prisma.project.findFirst({
      where: {
        originWaNumber: waNumber,
        budgets: { some: { status: { in: [BudgetStatus.DRAFT, BudgetStatus.UNDER_REVIEW] } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    if (!project) return null;
    return this.getLatest(project.id);
  }

  async getLatest(projectId: string): Promise<Budget | null> {
    return this.prisma.budget.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
    });
  }

  list(projectId: string): Promise<Budget[]> {
    return this.prisma.budget.findMany({
      where: { projectId },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * One row per project = its **latest** budget. Powers the cross-project
   * "Presupuestos" admin page. We only return the most recent version per
   * project so the list reflects the current state of each project's budget.
   */
  async latestAcrossProjects(): Promise<Budget[]> {
    // Postgres-flavoured DISTINCT ON via Prisma's groupBy isn't direct; the
    // cleanest portable approach is: pull all budgets ordered desc by version
    // and take the first for each projectId in JS. Small data volume — fine.
    const all = await this.prisma.budget.findMany({
      orderBy: [{ projectId: 'asc' }, { version: 'desc' }],
    });
    const latestById = new Map<string, Budget>();
    for (const b of all) {
      if (!latestById.has(b.projectId)) latestById.set(b.projectId, b);
    }
    return Array.from(latestById.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async findOne(id: string): Promise<Budget> {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new NotFoundException(`Budget ${id} not found`);
    return budget;
  }

  private async approve(projectId: string): Promise<Budget> {
    const latest = await this.requireLatestDraft(projectId);
    const approved = await this.prisma.budget.update({
      where: { id: latest.id },
      data: { status: BudgetStatus.APPROVED },
    });
    await this.events.record({
      type: EventType.BUDGET_APPROVED,
      projectId,
      payload: { budgetId: approved.id, version: approved.version },
    });
    return approved;
  }

  private async requireLatestDraft(projectId: string): Promise<Budget> {
    const latest = await this.getLatest(projectId);
    if (!latest) throw new NotFoundException('No budget for this project');
    if (latest.status === BudgetStatus.APPROVED) {
      throw new NotFoundException('Latest budget is already approved');
    }
    return latest;
  }

  private async maxVersion(projectId: string): Promise<number> {
    const agg = await this.prisma.budget.aggregate({
      where: { projectId },
      _max: { version: true },
    });
    return agg._max.version ?? 0;
  }

  static toDto(budget: Budget): BudgetDto {
    return {
      id: budget.id,
      projectId: budget.projectId,
      version: budget.version,
      status: budget.status,
      chapters: budget.chapters as unknown as BudgetChapter[],
      pemTotal: budget.pemTotal,
      feePercent: budget.feePercent,
      feeMinAmount: budget.feeMinAmount,
      feeAmount: budget.feeAmount,
      taxBaseTotal: budget.taxBaseTotal,
      notes: budget.notes,
      createdAt: budget.createdAt.toISOString(),
    };
  }
}

function findItem(chapters: BudgetChapter[], code: string): BudgetItem | undefined {
  for (const c of chapters) {
    const found = c.items.find((i) => i.code === code);
    if (found) return found;
  }
  return undefined;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
