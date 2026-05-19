import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import type { BudgetDto, ProjectDto, ClientDto } from '@studio/shared';
import { api } from '../lib/api';
import { fmtEur, fmtDateTime } from '../lib/format';
import { BudgetStatusBadge } from '../components/StatusBadge';

/** Latest budget per project, across the whole studio. */
export function BudgetsPage() {
  const budgets = useQuery({
    queryKey: ['budgets', 'latest-all'],
    queryFn: () => api.get<BudgetDto[]>('/budgets'),
  });
  const projects = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<ProjectDto[]>('/projects'),
  });
  const clients = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get<ClientDto[]>('/clients'),
  });

  const projectsById = new Map((projects.data ?? []).map((p) => [p.id, p]));
  const clientsById = new Map((clients.data ?? []).map((c) => [c.id, c]));

  const rows = (budgets.data ?? []).map((b) => {
    const p = projectsById.get(b.projectId);
    const c = p ? clientsById.get(p.clientId) : undefined;
    return { budget: b, project: p, client: c };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Presupuestos</h1>
        <p className="mt-1 text-sm text-muted">
          {budgets.data
            ? `${budgets.data.length} presupuesto${budgets.data.length === 1 ? '' : 's'} (último por proyecto)`
            : ' '}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {budgets.isLoading && <div className="p-6 text-sm text-muted">Cargando…</div>}
        {budgets.isError && (
          <div className="p-6 text-sm text-status-error">No se pudo cargar.</div>
        )}
        {budgets.data && budgets.data.length === 0 && (
          <div className="flex flex-col items-center gap-3 p-12 text-center text-sm text-muted">
            <FileText className="h-10 w-10 text-muted/40" />
            <div>
              Aún no hay presupuestos.
              <br />
              <span className="text-xs">
                Crea un proyecto desde WhatsApp y se generará uno automáticamente.
              </span>
            </div>
          </div>
        )}
        {rows.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Proyecto</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Versión</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 text-right font-medium">PEM</th>
                <th className="px-5 py-3 text-right font-medium">Honorarios</th>
                <th className="px-5 py-3 text-right font-medium">Base</th>
                <th className="px-5 py-3 font-medium">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ budget, project, client }, i) => (
                <tr
                  key={budget.id}
                  className={`border-b border-border last:border-0 ${
                    i % 2 === 1 ? 'bg-bg/40' : ''
                  } transition-colors hover:bg-bg`}
                >
                  <td className="px-5 py-3 font-medium">
                    {project ? (
                      <Link to={`/projects/${project.id}`} className="text-accent hover:underline">
                        {project.type}{' '}
                        <span className="ml-1 font-mono text-xs text-muted">
                          #{project.id.slice(-6)}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {client ? (
                      <Link
                        to={`/clients/${client.id}`}
                        className="text-muted hover:text-accent hover:underline"
                      >
                        {client.name}
                      </Link>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted">v{budget.version}</td>
                  <td className="px-5 py-3">
                    <BudgetStatusBadge status={budget.status} />
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{fmtEur(budget.pemTotal)}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-muted">
                    {fmtEur(budget.feeAmount)}
                  </td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums">
                    {fmtEur(budget.taxBaseTotal)}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">{fmtDateTime(budget.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
