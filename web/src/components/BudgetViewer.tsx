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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold tracking-tight">
            Presupuesto <span className="text-muted">v{budget.version}</span>
          </h3>
          <BudgetStatusBadge status={budget.status} />
        </div>
      </div>

      {/* Totals strip */}
      <div className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-bg p-4">
        <Total label="PEM" value={budget.pemTotal} />
        <Total label="Honorarios" value={budget.feeAmount} muted />
        <Total label="Base imponible" value={budget.taxBaseTotal} accent />
      </div>

      {/* Chapters */}
      <div className="space-y-4">
        {budget.chapters.map((c) => {
          const sub = c.items.reduce((s, i) => s + i.total, 0);
          return (
            <div
              key={c.code}
              className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-border bg-bg px-4 py-2.5">
                <div className="flex items-baseline gap-2 text-sm">
                  <span className="font-mono text-xs text-muted">{c.code}.</span>
                  <span className="font-semibold">{c.title}</span>
                </div>
                <div className="text-sm font-semibold tabular-nums">{fmtEur(sub)}</div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-muted">
                    <th className="px-4 py-2 text-left font-medium">Cód</th>
                    <th className="px-2 py-2 text-left font-medium">Ud</th>
                    <th className="px-2 py-2 text-left font-medium">Descripción</th>
                    <th className="px-2 py-2 text-right font-medium">Cant.</th>
                    <th className="px-2 py-2 text-right font-medium">Precio</th>
                    <th className="px-4 py-2 text-right font-medium">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {c.items.map((it, idx) => (
                    <tr
                      key={it.code}
                      className={`border-t border-border ${idx % 2 === 1 ? 'bg-bg/30' : ''}`}
                    >
                      <td className="px-4 py-2 align-top font-mono text-xs text-muted">
                        {it.code}
                      </td>
                      <td className="px-2 py-2 align-top text-xs text-muted">{it.unit}</td>
                      <td className="px-2 py-2 align-top">{it.description}</td>
                      <td className="px-2 py-2 text-right align-top tabular-nums">
                        {fmtNumber(it.quantity)}
                      </td>
                      <td className="px-2 py-2 text-right align-top tabular-nums">
                        {fmtEur(it.unitPrice)}
                      </td>
                      <td className="px-4 py-2 text-right align-top font-medium tabular-nums">
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
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-sm">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-800">
            Notas
          </div>
          <div className="text-amber-900">{budget.notes}</div>
        </div>
      )}
    </div>
  );
}

function Total({ label, value, accent, muted }: { label: string; value: number; accent?: boolean; muted?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div
        className={`mt-1 text-base font-semibold tabular-nums ${
          accent ? 'text-accent' : muted ? 'text-ink/80' : ''
        }`}
      >
        {fmtEur(value)}
      </div>
    </div>
  );
}
