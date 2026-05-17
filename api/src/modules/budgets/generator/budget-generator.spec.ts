import { ProjectType } from '@studio/shared';
import {
  BudgetGeneratorService,
  HONORARIOS_MIN_AMOUNT,
  HONORARIOS_PERCENT,
} from './budget-generator.service';

describe('BudgetGeneratorService', () => {
  const svc = new BudgetGeneratorService();

  it('produces chapters in standard order, with only non-empty chapters', () => {
    const { chapters } = svc.generate({
      type: ProjectType.REFORMA_PARCIAL,
      areaM2: 75,
      scope: 'cocina y baño',
    });
    const codes = chapters.map((c) => c.code).map(Number);
    expect(codes).toEqual([...codes].sort((a, b) => a - b));
    for (const c of chapters) {
      expect(c.items.length).toBeGreaterThan(0);
    }
  });

  it('every line item total equals quantity × unitPrice (rounded to 2 decimals)', () => {
    const { chapters } = svc.generate({
      type: ProjectType.REFORMA_PARCIAL,
      areaM2: 75,
      scope: 'cocina y baño',
    });
    for (const item of chapters.flatMap((c) => c.items)) {
      const expected = Math.round(item.quantity * item.unitPrice * 100) / 100;
      expect(item.total).toBeCloseTo(expected, 2);
    }
  });

  it('PEM equals the sum of all item totals', () => {
    const { chapters, totals } = svc.generate({
      type: ProjectType.REFORMA_INTEGRAL,
      areaM2: 120,
      scope: 'piso entero',
    });
    const sum = chapters.flatMap((c) => c.items).reduce((s, i) => s + i.total, 0);
    expect(totals.pemTotal).toBeCloseTo(Math.round(sum * 100) / 100, 2);
  });

  it('honorarios apply the 15% rule when PEM × 15% exceeds the minimum', () => {
    const { totals } = svc.generate({
      type: ProjectType.REFORMA_INTEGRAL,
      areaM2: 200,
      scope: 'piso entero',
    });
    expect(totals.feeAmount).toBeCloseTo(
      Math.round(totals.pemTotal * HONORARIOS_PERCENT * 100) / 100,
      2,
    );
    expect(totals.feeAmount).toBeGreaterThan(HONORARIOS_MIN_AMOUNT);
  });

  it('honorarios fall back to the €4,500 minimum for small projects', () => {
    const { totals } = svc.generate({
      type: ProjectType.INTERIORISMO,
      areaM2: 5,
      scope: null,
    });
    // INTERIORISMO catalog is small → PEM × 15% is far below 4500
    expect(totals.feeAmount).toBe(HONORARIOS_MIN_AMOUNT);
  });

  it('taxBaseTotal = pemTotal + feeAmount', () => {
    const { totals } = svc.generate({
      type: ProjectType.REFORMA_PARCIAL,
      areaM2: 75,
      scope: 'cocina y baño',
    });
    expect(totals.taxBaseTotal).toBeCloseTo(totals.pemTotal + totals.feeAmount, 2);
  });

  it('includes kitchen items only when scope mentions kitchen', () => {
    const withKitchen = svc.generate({
      type: ProjectType.REFORMA_PARCIAL,
      areaM2: 50,
      scope: 'cocina',
    });
    const withoutKitchen = svc.generate({
      type: ProjectType.REFORMA_PARCIAL,
      areaM2: 50,
      scope: 'solo baño',
    });
    const ch10 = (chs: { code: string; items: unknown[] }[]) =>
      chs.find((c) => c.code === '10')?.items.length ?? 0;
    expect(ch10(withKitchen.chapters)).toBeGreaterThan(0);
    expect(ch10(withoutKitchen.chapters)).toBe(0);
  });

  it('reproduces the Lekunberri ballpark for a kitchen + closet parcial of 75 m²', () => {
    const { totals } = svc.generate({
      type: ProjectType.REFORMA_PARCIAL,
      areaM2: 75,
      scope: 'cocina y vestidor',
    });
    // Lekunberri actual: PEM 47.961,63 — generator within ±20% is acceptable
    // for a rule-based draft (studio refines via WhatsApp).
    expect(totals.pemTotal).toBeGreaterThan(38_000);
    expect(totals.pemTotal).toBeLessThan(58_000);
  });

  it('recomputeTotals re-derives the totals from an edited chapter set', () => {
    const { chapters } = svc.generate({
      type: ProjectType.REFORMA_PARCIAL,
      areaM2: 75,
      scope: 'cocina y baño',
    });
    // Remove the most expensive item and re-derive
    const flat = chapters.flatMap((c) => c.items);
    const max = flat.reduce((a, b) => (a.total > b.total ? a : b));
    const trimmed = chapters.map((c) => ({
      ...c,
      items: c.items.filter((it) => it.code !== max.code),
    }));
    const totals = svc.recomputeTotals(trimmed);
    const expectedPem =
      Math.round(flat.filter((it) => it.code !== max.code).reduce((s, i) => s + i.total, 0) * 100) /
      100;
    expect(totals.pemTotal).toBeCloseTo(expectedPem, 2);
    expect(totals.feeAmount).toBeCloseTo(
      Math.max(expectedPem * HONORARIOS_PERCENT, HONORARIOS_MIN_AMOUNT),
      2,
    );
  });
});
