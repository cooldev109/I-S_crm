import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { DashboardSummaryDto } from '@studio/shared';
import { api } from '../lib/api';
import { fmtDateTime } from '../lib/format';

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardSummaryDto>('/dashboard/summary'),
  });

  if (isLoading) return <div className="text-sm text-muted">Cargando…</div>;
  if (isError || !data) return <div className="text-sm text-status-error">No se pudo cargar.</div>;

  const { counts, recentEvents } = data;
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Clientes" value={counts.clients} to="/clients" />
        <Kpi label="Proyectos" value={counts.projects} to="/projects" />
        <Kpi label="Presupuestos borrador" value={counts.budgetsDraft} />
        <Kpi label="Presupuestos aprobados" value={counts.budgetsApproved} />
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-medium text-muted">Proyectos por estado</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          {Object.entries(counts.projectsByStatus).map(([s, n]) => (
            <span
              key={s}
              className="rounded-full border border-border px-3 py-1"
            >
              {s} <span className="font-medium">{n}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-medium text-muted">Actividad reciente</h2>
        {recentEvents.length === 0 ? (
          <div className="text-sm text-muted">Sin actividad todavía.</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {recentEvents.slice(0, 15).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3">
                <span>
                  {e.projectId ? (
                    <Link to={`/projects/${e.projectId}`} className="text-accent hover:underline">
                      {e.type}
                    </Link>
                  ) : (
                    <span>{e.type}</span>
                  )}
                </span>
                <span className="text-xs text-muted">{fmtDateTime(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, to }: { label: string; value: number; to?: string }) {
  const inner = (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
  return to ? (
    <Link to={to} className="block hover:border-accent">
      {inner}
    </Link>
  ) : (
    inner
  );
}
