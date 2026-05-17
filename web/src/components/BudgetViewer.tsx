import type { BudgetDto } from '@studio/shared';
import { fmtEur, fmtNumber } from '../lib/format';
import { BudgetStatusBadge } from './StatusBadge';

/**
 * Chapter-grouped table view of a budget. Mirrors the visual layout of the
 * studio's real "Presupuesto Estimativo" PDFs so a reader can scan it the
 * same way (Lekunberri shape — see docs/client-data-analysis.md).
 */
export function BudgetViewer({ budget }: { budget: BudgetDto }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Presupuesto v{budget.version}</h3>
          <BudgetStatusBadge status={budget.status} />
        </div>
        <div className="text-sm text-muted">
          PEM <span className="text-ink font-medium">{fmtEur(budget.pemTotal)}</span>
          {' · '}
          Honorarios <span className="text-ink font-medium">{fmtEur(budget.feeAmount)}</span>
          {' · '}
          Base <span className="text-ink font-medium">{fmtEur(budget.taxBaseTotal)}</span>
        </div>
      </div>

      <div className="space-y-5">
        {budget.chapters.map((c) => {
          const sub = c.items.reduce((s, i) => s + i.total, 0);
          return (
            <div key={c.code} className="rounded-lg border border-border bg-surface">
              <div className="flex items-baseline justify-between border-b border-border bg-bg px-4 py-2">
                <div className="text-sm font-semibold">
                  {c.code}. {c.title}
                </div>
                <div className="text-sm font-medium">{fmtEur(sub)}</div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted">
                    <th className="px-4 py-2 text-left">Cód</th>
                    <th className="px-2 py-2 text-left">Ud</th>
                    <th className="px-2 py-2 text-left">Descripción</th>
                    <th className="px-2 py-2 text-right">Cant.</th>
                    <th className="px-2 py-2 text-right">Precio</th>
                    <th className="px-4 py-2 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {c.items.map((it) => (
                    <tr key={it.code} className="border-t border-border">
                      <td className="px-4 py-2 align-top font-mono text-xs">{it.code}</td>
                      <td className="px-2 py-2 align-top text-xs">{it.unit}</td>
                      <td className="px-2 py-2 align-top">{it.description}</td>
                      <td className="px-2 py-2 text-right align-top">{fmtNumber(it.quantity)}</td>
                      <td className="px-2 py-2 text-right align-top">{fmtEur(it.unitPrice)}</td>
                      <td className="px-4 py-2 text-right align-top font-medium">
                        {fmtEur(it.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {budget.notes && (
        <div className="rounded-lg border border-border bg-surface p-3 text-sm">
          <div className="mb-1 text-xs font-medium text-muted">Notas</div>
          <div>{budget.notes}</div>
        </div>
      )}
    </div>
  );
}
