import type { BudgetDto } from '@studio/shared';
import { fmtEur } from '../lib/format';

type ItemKey = { chapter: string; code: string };
type DiffRow =
  | { kind: 'added'; key: ItemKey; total: number; description: string }
  | { kind: 'removed'; key: ItemKey; total: number; description: string }
  | {
      kind: 'changed';
      key: ItemKey;
      description: string;
      oldPrice: number;
      newPrice: number;
      oldQty: number;
      newQty: number;
      delta: number;
    };

/**
 * Side-by-side diff of two budget versions. The left is the older version,
 * the right is the newer. We surface three things per item: added, removed,
 * or changed (quantity, unit price, or both). Unchanged items aren't listed.
 */
export function BudgetVersionDiff({ older, newer }: { older: BudgetDto; newer: BudgetDto }) {
  const rows = diff(older, newer);
  const delta = newer.pemTotal - older.pemTotal;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div className="text-sm">
          Comparando <strong>v{older.version}</strong> → <strong>v{newer.version}</strong>
        </div>
        <div className="text-sm">
          ΔPEM:{' '}
          <span className={delta >= 0 ? 'text-status-ok' : 'text-status-error'}>
            {delta >= 0 ? '+' : ''}
            {fmtEur(delta)}
          </span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded border border-dashed border-border bg-surface p-4 text-center text-sm text-muted">
          Sin cambios entre versiones.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted">
              <th className="px-2 py-2 text-left">Cambio</th>
              <th className="px-2 py-2 text-left">Cód</th>
              <th className="px-2 py-2 text-left">Descripción</th>
              <th className="px-2 py-2 text-right">Antes</th>
              <th className="px-2 py-2 text-right">Después</th>
              <th className="px-2 py-2 text-right">Impacto</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t border-border">
                <td className="px-2 py-2 align-top">
                  <Tag kind={r.kind} />
                </td>
                <td className="px-2 py-2 align-top font-mono text-xs">{r.key.code}</td>
                <td className="px-2 py-2 align-top">{r.description}</td>
                {r.kind === 'changed' ? (
                  <>
                    <td className="px-2 py-2 text-right align-top text-muted">
                      {r.oldQty} × {fmtEur(r.oldPrice)}
                    </td>
                    <td className="px-2 py-2 text-right align-top">
                      {r.newQty} × {fmtEur(r.newPrice)}
                    </td>
                    <td
                      className={`px-2 py-2 text-right align-top ${
                        r.delta >= 0 ? 'text-status-ok' : 'text-status-error'
                      }`}
                    >
                      {r.delta >= 0 ? '+' : ''}
                      {fmtEur(r.delta)}
                    </td>
                  </>
                ) : r.kind === 'added' ? (
                  <>
                    <td className="px-2 py-2 text-right align-top text-muted">—</td>
                    <td className="px-2 py-2 text-right align-top">{fmtEur(r.total)}</td>
                    <td className="px-2 py-2 text-right align-top text-status-ok">
                      +{fmtEur(r.total)}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-2 py-2 text-right align-top">{fmtEur(r.total)}</td>
                    <td className="px-2 py-2 text-right align-top text-muted">—</td>
                    <td className="px-2 py-2 text-right align-top text-status-error">
                      −{fmtEur(r.total)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Tag({ kind }: { kind: DiffRow['kind'] }) {
  const map = {
    added: 'bg-green-100 text-green-800',
    removed: 'bg-red-100 text-red-700',
    changed: 'bg-amber-100 text-amber-800',
  } as const;
  const label = { added: 'añadido', removed: 'quitado', changed: 'cambiado' }[kind];
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[kind]}`}>
      {label}
    </span>
  );
}

function diff(older: BudgetDto, newer: BudgetDto): DiffRow[] {
  const olderMap = flatten(older);
  const newerMap = flatten(newer);
  const rows: DiffRow[] = [];

  for (const [code, n] of newerMap) {
    const o = olderMap.get(code);
    if (!o) {
      rows.push({
        kind: 'added',
        key: { chapter: code.split('.')[0], code },
        total: n.total,
        description: n.description,
      });
    } else if (o.unitPrice !== n.unitPrice || o.quantity !== n.quantity) {
      rows.push({
        kind: 'changed',
        key: { chapter: code.split('.')[0], code },
        description: n.description,
        oldPrice: o.unitPrice,
        newPrice: n.unitPrice,
        oldQty: o.quantity,
        newQty: n.quantity,
        delta: n.total - o.total,
      });
    }
  }
  for (const [code, o] of olderMap) {
    if (!newerMap.has(code)) {
      rows.push({
        kind: 'removed',
        key: { chapter: code.split('.')[0], code },
        total: o.total,
        description: o.description,
      });
    }
  }
  return rows.sort((a, b) => a.key.code.localeCompare(b.key.code, undefined, { numeric: true }));
}

interface FlatItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}
function flatten(b: BudgetDto): Map<string, FlatItem> {
  const out = new Map<string, FlatItem>();
  for (const c of b.chapters) {
    for (const it of c.items) {
      out.set(it.code, {
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
      });
    }
  }
  return out;
}
