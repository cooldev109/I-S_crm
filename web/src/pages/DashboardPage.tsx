import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, FolderKanban, FileEdit, CheckCircle2, Activity, type LucideIcon } from 'lucide-react';
import type { DashboardSummaryDto } from '@studio/shared';
import { api } from '../lib/api';
import { fmtDateTime } from '../lib/format';

const EVENT_LABEL: Record<string, string> = {
  'client.created': 'Cliente creado',
  'project.created': 'Proyecto creado',
  'project.status_changed': 'Estado del proyecto cambiado',
  'budget.generated': 'Presupuesto generado',
  'budget.revised': 'Presupuesto revisado',
  'budget.approved': 'Presupuesto aprobado',
  'whatsapp.received': 'WhatsApp recibido',
  'whatsapp.sent': 'WhatsApp enviado',
};

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardSummaryDto>('/dashboard/summary'),
  });

  if (isLoading) return <div className="text-sm text-muted">Cargando…</div>;
  if (isError || !data)
    return <div className="text-sm text-status-error">No se pudo cargar.</div>;

  const { counts, recentEvents } = data;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Resumen del estudio en tiempo real.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Clientes" value={counts.clients} Icon={Users} to="/clients" accent="text-accent" />
        <Kpi
          label="Proyectos"
          value={counts.projects}
          Icon={FolderKanban}
          to="/projects"
          accent="text-accent"
        />
        <Kpi
          label="Borradores"
          value={counts.budgetsDraft}
          Icon={FileEdit}
          accent="text-status-review"
        />
        <Kpi
          label="Aprobados"
          value={counts.budgetsApproved}
          Icon={CheckCircle2}
          accent="text-status-ok"
        />
      </div>

      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium">Proyectos por estado</h2>
        </div>
        <div className="flex flex-wrap gap-2 p-5">
          {Object.entries(counts.projectsByStatus).map(([s, n]) => (
            <span
              key={s}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-1 text-xs"
            >
              <span className="font-medium text-ink">{n}</span>
              <span className="text-muted">{s}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Activity className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-medium">Actividad reciente</h2>
        </div>
        {recentEvents.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">Sin actividad todavía.</div>
        ) : (
          <ul className="divide-y divide-border">
            {recentEvents.slice(0, 15).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                <span className="truncate">
                  {e.projectId ? (
                    <Link
                      to={`/projects/${e.projectId}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {EVENT_LABEL[e.type] ?? e.type}
                    </Link>
                  ) : (
                    <span className="font-medium">{EVENT_LABEL[e.type] ?? e.type}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-muted">{fmtDateTime(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

interface KpiProps {
  label: string;
  value: number;
  Icon: LucideIcon;
  to?: string;
  accent: string;
}

function Kpi({ label, value, Icon, to, accent }: KpiProps) {
  const inner = (
    <div className="group rounded-xl border border-border bg-surface p-5 transition hover:border-accent/50 hover:shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
        <Icon className={`h-4 w-4 ${accent}`} strokeWidth={2} />
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
  return to ? (
    <Link to={to} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}
