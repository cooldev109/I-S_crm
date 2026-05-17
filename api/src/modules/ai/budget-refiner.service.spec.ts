import { ProjectType } from '@studio/shared';
import { BudgetRefinerService } from './budget-refiner.service';
import { OpenAiProvider } from './openai.provider';

const originalDraft = [
  {
    code: '1',
    title: 'TRABAJOS PREVIOS/DEMOLICIONES',
    items: [
      { code: '1.1', unit: 'M2', description: 'demoliciones', quantity: 4, unitPrice: 30, total: 120 },
      { code: '1.2', unit: 'M2', description: 'pavimentos', quantity: 3, unitPrice: 31, total: 93 },
    ],
  },
];

function provider(response: string | null): OpenAiProvider {
  return {
    name: response === null ? 'noop' : 'openai',
    complete: async () => response,
  };
}

describe('BudgetRefinerService', () => {
  const baseInput = {
    projectType: ProjectType.REFORMA_PARCIAL,
    areaM2: 75,
    scope: 'cocina',
    chapters: originalDraft,
  };

  it('falls back to the original draft when no AI is configured', async () => {
    const svc = new BudgetRefinerService(provider(null));
    const r = await svc.refine(baseInput);
    expect(r.usedAi).toBe(false);
    expect(r.refined).toEqual(originalDraft);
    expect(r.notes).toMatch(/no configurado/i);
  });

  it('falls back when the AI returns non-JSON', async () => {
    const svc = new BudgetRefinerService(provider('this is not json'));
    const r = await svc.refine(baseInput);
    expect(r.usedAi).toBe(false);
    expect(r.refined).toEqual(originalDraft);
  });

  it('accepts a valid refinement and recomputes totals from qty × price', async () => {
    const aiReply = JSON.stringify({
      notes: 'Ajusté precio de 1.1 ligeramente.',
      chapters: [
        {
          code: '1',
          title: 'TRABAJOS PREVIOS/DEMOLICIONES',
          items: [
            { code: '1.1', unit: 'M2', description: 'Demolición tabique', quantity: 4, unitPrice: 35, total: 999 },
            { code: '1.2', unit: 'M2', description: 'Pavimentos cerámicos', quantity: 3, unitPrice: 31, total: 93 },
          ],
        },
      ],
    });
    const svc = new BudgetRefinerService(provider(aiReply));
    const r = await svc.refine(baseInput);
    expect(r.usedAi).toBe(true);
    const item11 = r.refined[0].items.find((i) => i.code === '1.1')!;
    expect(item11.unitPrice).toBe(35);
    // Recomputed by us — ignored the AI's bogus 999 total
    expect(item11.total).toBe(4 * 35);
    expect(r.notes).toMatch(/ajust/i);
  });

  it('clamps an out-of-range price to ±50% of the original', async () => {
    const aiReply = JSON.stringify({
      notes: 'precio inflado',
      chapters: [
        {
          code: '1',
          title: 'TRABAJOS PREVIOS/DEMOLICIONES',
          items: [
            { code: '1.1', unit: 'M2', description: 'x', quantity: 4, unitPrice: 5000, total: 20000 },
          ],
        },
      ],
    });
    const svc = new BudgetRefinerService(provider(aiReply));
    const r = await svc.refine(baseInput);
    const item11 = r.refined[0].items.find((i) => i.code === '1.1')!;
    // Original price 30, clamp = ×1.5 = 45
    expect(item11.unitPrice).toBe(45);
    expect(item11.total).toBe(4 * 45);
  });

  it('ignores items the AI invented (no matching code in original)', async () => {
    const aiReply = JSON.stringify({
      notes: 'añadí algo',
      chapters: [
        {
          code: '1',
          title: 'TRABAJOS PREVIOS/DEMOLICIONES',
          items: [
            { code: '1.1', unit: 'M2', description: 'a', quantity: 4, unitPrice: 30, total: 120 },
            { code: '99.99', unit: 'UD', description: 'invented', quantity: 1, unitPrice: 1000, total: 1000 },
          ],
        },
      ],
    });
    const svc = new BudgetRefinerService(provider(aiReply));
    const r = await svc.refine(baseInput);
    const codes = r.refined.flatMap((c) => c.items.map((i) => i.code));
    expect(codes).toContain('1.1');
    expect(codes).not.toContain('99.99');
  });

  it('falls back when the AI returns the wrong overall shape', async () => {
    const svc = new BudgetRefinerService(provider(JSON.stringify({ wrong: true })));
    const r = await svc.refine(baseInput);
    expect(r.usedAi).toBe(false);
    expect(r.refined).toEqual(originalDraft);
  });
});
