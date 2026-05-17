import { Inject, Injectable, Logger } from '@nestjs/common';
import { BudgetChapter, BudgetItem, ProjectType } from '@studio/shared';
import { OPENAI_PROVIDER, OpenAiProvider } from './openai.provider';

export interface RefineInput {
  projectType: ProjectType;
  areaM2: number | null;
  scope: string | null;
  chapters: BudgetChapter[];
}

export interface RefineResult {
  refined: BudgetChapter[];
  /** Short rationale from the model — surfaced to the studio. */
  notes: string;
  /** True when an actual OpenAI call took place. */
  usedAi: boolean;
}

/**
 * AI refinement of a rule-based budget draft. **Never** invents numbers
 * unchecked — the model returns a structured chapter list that we:
 *
 *   1. validate against a strict shape,
 *   2. clamp each unitPrice to within ±50% of the original (no wild moves),
 *   3. recompute every line total ourselves (qty × unitPrice).
 *
 * If the model output fails any check, we fall back to the original draft
 * and surface the reason. Same when no API key is configured (Noop provider).
 *
 * With a single historical budget on file (Lekunberri), the practical wins
 * are: tidier descriptions, sensible price adjustments where Lekunberri's
 * defaults are clearly off for a given project, and flagging missing items.
 * Quality grows as more historical budgets arrive.
 */
@Injectable()
export class BudgetRefinerService {
  private readonly logger = new Logger(BudgetRefinerService.name);

  constructor(@Inject(OPENAI_PROVIDER) private readonly ai: OpenAiProvider) {}

  async refine(input: RefineInput): Promise<RefineResult> {
    if (this.ai.name === 'noop') {
      return { refined: input.chapters, notes: 'AI no configurado (sin OPENAI_API_KEY).', usedAi: false };
    }

    const raw = await this.ai.complete({
      system: SYSTEM_PROMPT,
      user: JSON.stringify(buildUserContext(input)),
    });
    if (!raw) {
      return { refined: input.chapters, notes: 'AI no devolvió respuesta.', usedAi: false };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.logger.warn('AI returned non-JSON output');
      return { refined: input.chapters, notes: 'AI devolvió formato inválido.', usedAi: false };
    }

    const validated = this.validateAndClamp(input.chapters, parsed);
    if (!validated) {
      return { refined: input.chapters, notes: 'AI propuso cambios fuera de rango.', usedAi: false };
    }

    return {
      refined: validated.chapters,
      notes: validated.notes,
      usedAi: true,
    };
  }

  /**
   * Strictly shape-check the AI's reply, drop unknown items, and clamp prices
   * within ±50% of the rule-based original. Returns null if the shape is
   * wrong enough that we shouldn't trust any of it.
   */
  private validateAndClamp(
    original: BudgetChapter[],
    raw: unknown,
  ): { chapters: BudgetChapter[]; notes: string } | null {
    if (!raw || typeof raw !== 'object') return null;
    const obj = raw as Record<string, unknown>;
    const chaptersIn = obj.chapters;
    const notes = typeof obj.notes === 'string' ? obj.notes : 'Refinado por IA.';
    if (!Array.isArray(chaptersIn)) return null;

    // Build a lookup of original items so we can clamp & drop hallucinations.
    const origItems = new Map<string, BudgetItem>();
    for (const c of original) for (const it of c.items) origItems.set(it.code, it);

    const out: BudgetChapter[] = [];
    for (const c of chaptersIn) {
      if (!c || typeof c !== 'object') continue;
      const cc = c as { code?: unknown; title?: unknown; items?: unknown };
      if (typeof cc.code !== 'string' || typeof cc.title !== 'string') continue;
      if (!Array.isArray(cc.items)) continue;
      const items: BudgetItem[] = [];
      for (const it of cc.items) {
        const safe = this.coerceItem(it, origItems);
        if (safe) items.push(safe);
      }
      if (items.length > 0) out.push({ code: cc.code, title: cc.title, items });
    }
    if (out.length === 0) return null;
    return { chapters: out, notes };
  }

  private coerceItem(it: unknown, original: Map<string, BudgetItem>): BudgetItem | null {
    if (!it || typeof it !== 'object') return null;
    const r = it as Record<string, unknown>;
    if (typeof r.code !== 'string') return null;
    const orig = original.get(r.code);
    if (!orig) return null; // ignore items the model invented

    const quantity = num(r.quantity, orig.quantity);
    const unitPrice = clampPrice(num(r.unitPrice, orig.unitPrice), orig.unitPrice);
    if (!Number.isFinite(quantity) || quantity < 0) return null;
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) return null;
    return {
      code: r.code,
      unit: typeof r.unit === 'string' ? r.unit : orig.unit,
      description: typeof r.description === 'string' ? r.description : orig.description,
      quantity: round2(quantity),
      unitPrice: round2(unitPrice),
      total: round2(quantity * unitPrice),
    };
  }
}

const SYSTEM_PROMPT = `Eres un asistente experto en presupuestos de obra para un
estudio de arquitectura e interiorismo en Donostia. Recibes un borrador de
presupuesto generado por reglas y debes refinarlo: ajustar descripciones para
mayor claridad, corregir precios o cantidades cuando estén claramente fuera de
mercado para el tipo de proyecto, y eliminar partidas irrelevantes. No
inventes códigos nuevos. Devuelve SOLO JSON con la forma:
{ "chapters": [{ "code": "1", "title": "...", "items": [...] }], "notes": "..." }
Los precios se expresan sin IVA.`;

function buildUserContext(input: RefineInput): unknown {
  return {
    project: {
      type: input.projectType,
      areaM2: input.areaM2,
      scope: input.scope,
    },
    draft: input.chapters,
  };
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

/** Allow the AI to move a unitPrice no more than 50% off the original. */
function clampPrice(proposed: number, original: number): number {
  const lo = original * 0.5;
  const hi = original * 1.5;
  return Math.min(hi, Math.max(lo, proposed));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
