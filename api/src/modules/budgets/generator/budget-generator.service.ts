import { Injectable } from '@nestjs/common';
import { BudgetChapter, BudgetItem, ProjectType } from '@studio/shared';
import { STANDARD_CHAPTERS, chapterByCode } from '../catalog/chapters';
import { CATALOG, CatalogItem, QuantityRule } from '../catalog/catalog';

/**
 * Locked business rules — see docs/client-data-analysis.md.
 * Do not change without confirming with the studio.
 */
export const HONORARIOS_PERCENT = 0.15;
export const HONORARIOS_MIN_AMOUNT = 4500;

export interface BudgetTotals {
  pemTotal: number;
  feePercent: number;
  feeMinAmount: number;
  feeAmount: number;
  taxBaseTotal: number;
}

export interface ProjectContext {
  type: ProjectType;
  areaM2: number | null;
  scope: string | null;
}

/**
 * Rule-based budget generator. Walks the catalog with a project context,
 * includes items whose `defaultFor` matches the project type, computes each
 * quantity from its `QuantityRule`, and groups everything into chapters.
 *
 * Output matches the shape stored in Budget.chapters JSON.
 *
 * The output is the **draft starting point** — the studio refines it via
 * WhatsApp adjustments (next module). AI (Phase 1.1 Week 3) sits on top of
 * this and only refines coherence; it never produces unvalidated numbers.
 */
@Injectable()
export class BudgetGeneratorService {
  generate(project: ProjectContext): { chapters: BudgetChapter[]; totals: BudgetTotals } {
    const items = CATALOG.filter((item) => item.defaultFor.includes(project.type))
      .map((item) => this.materialise(item, project))
      // Drop items whose quantity resolved to 0 (e.g. kitchen items for a
      // bath-only scope) — a zero-qty line has no place in a budget.
      .filter((item) => item.quantity > 0);

    const chapters = this.groupByChapter(items);
    const pemTotal = round2(items.reduce((sum, it) => sum + it.total, 0));
    const totals = this.computeTotals(pemTotal);
    return { chapters, totals };
  }

  /** Re-derive totals after the studio adjusts the chapter list. */
  recomputeTotals(chapters: BudgetChapter[]): BudgetTotals {
    const pem = chapters
      .flatMap((c) => c.items)
      .reduce((sum, it) => sum + it.total, 0);
    return this.computeTotals(round2(pem));
  }

  private computeTotals(pemTotal: number): BudgetTotals {
    const feeAmount = Math.max(pemTotal * HONORARIOS_PERCENT, HONORARIOS_MIN_AMOUNT);
    return {
      pemTotal,
      feePercent: HONORARIOS_PERCENT,
      feeMinAmount: HONORARIOS_MIN_AMOUNT,
      feeAmount: round2(feeAmount),
      taxBaseTotal: round2(pemTotal + feeAmount),
    };
  }

  private materialise(item: CatalogItem, project: ProjectContext): BudgetItem {
    const quantity = round2(computeQuantity(item.quantity, project));
    const total = round2(quantity * item.defaultUnitPrice);
    return {
      code: item.code,
      unit: item.unit,
      description: item.description,
      quantity,
      unitPrice: item.defaultUnitPrice,
      total,
    };
  }

  private groupByChapter(items: BudgetItem[]): BudgetChapter[] {
    return STANDARD_CHAPTERS
      .map((chapter) => ({
        code: chapter.code,
        title: chapter.title,
        items: items.filter((it) => itemChapterCode(it.code) === chapter.code),
      }))
      .filter((chapter) => chapter.items.length > 0);
  }
}

function computeQuantity(rule: QuantityRule, project: ProjectContext): number {
  switch (rule.kind) {
    case 'fixed':
      return rule.value;
    case 'perAreaM2':
      return project.areaM2 != null ? project.areaM2 * rule.factor : 0;
    case 'perRoom':
      // Heuristic until we collect room counts per project: count 1 bath/kitchen
      // when the scope text mentions it (or the project area suggests a renovation).
      return scopeHasRoom(project.scope, rule.rooms) ? rule.factor : 0;
  }
}

function scopeHasRoom(scope: string | null, room: 'bath' | 'kitchen'): boolean {
  if (!scope) return true; // default: assume a renovation includes both
  const lower = scope.toLowerCase();
  if (room === 'bath') return /(ba[ñn]o|aseo|wc)/i.test(lower);
  return /(cocina|kitchen)/i.test(lower) || !/(solo|s[oó]lo|only)/i.test(lower);
}

function itemChapterCode(itemCode: string): string {
  return itemCode.split('.')[0] ?? '';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Re-export so the budgets service / WhatsApp module can reach it.
export { chapterByCode };
