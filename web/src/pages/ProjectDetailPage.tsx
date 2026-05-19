import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Sparkles, MessageCircle, Clock, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import type {
  BudgetDto,
  ClientDto,
  EventDto,
  MessageDto,
  ProjectDto,
} from '@studio/shared';
import { api } from '../lib/api';
import { fmtDateTime } from '../lib/format';
import { ProjectStatusBadge } from '../components/StatusBadge';
import { BudgetViewer } from '../components/BudgetViewer';
import { BudgetVersionDiff } from '../components/BudgetVersionDiff';
import { Timeline } from '../components/Timeline';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const project = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get<ProjectDto>(`/projects/${id}`),
    enabled: !!id,
  });
  const client = useQuery({
    queryKey: ['client', project.data?.clientId],
    queryFn: () => api.get<ClientDto>(`/clients/${project.data!.clientId}`),
    enabled: !!project.data?.clientId,
  });
  const budgets = useQuery({
    queryKey: ['budgets', id],
    queryFn: () => api.get<BudgetDto[]>(`/projects/${id}/budgets`),
    enabled: !!id,
  });
  const events = useQuery({
    queryKey: ['events', id],
    queryFn: () => api.get<EventDto[]>(`/projects/${id}/events`),
    enabled: !!id,
  });
  const messages = useQuery({
    queryKey: ['messages', id],
    queryFn: () => api.get<MessageDto[]>(`/projects/${id}/messages`),
    enabled: !!id,
  });

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['budgets', id] });
    qc.invalidateQueries({ queryKey: ['events', id] });
    qc.invalidateQueries({ queryKey: ['project', id] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const regenerate = useMutation({
    mutationFn: () => api.post<BudgetDto>(`/projects/${id}/budgets/generate`),
    onSuccess: (b) => {
      refreshAll();
      toast.success(`Borrador v${b.version} generado`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al regenerar'),
  });
  const refine = useMutation({
    mutationFn: () => api.post<BudgetDto & { usedAi: boolean }>(`/projects/${id}/budgets/refine`),
    onSuccess: (b) => {
      refreshAll();
      if (b.usedAi) {
        toast.success(`Refinado por IA — nueva v${b.version}`);
      } else {
        toast.info('IA no configurada — se creó una versión igual al borrador');
      }
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al refinar'),
  });

  const sortedBudgets = (budgets.data ?? []).slice().sort((a, b) => b.version - a.version);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = sortedBudgets.find((b) => b.id === selectedId) ?? sortedBudgets[0] ?? null;
  const [compareWithId, setCompareWithId] = useState<string | null>(null);
  const compareWith = sortedBudgets.find((b) => b.id === compareWithId) ?? null;

  if (project.isLoading) return <div className="text-sm text-muted">Cargando…</div>;
  if (project.isError || !project.data)
    return <div className="text-sm text-status-error">Proyecto no encontrado.</div>;

  const p = project.data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Proyectos
        </Link>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{p.type}</h1>
            <div className="mt-1 text-sm text-muted">
              <span className="font-mono">#{p.id.slice(-6)}</span>
              {' · '}
              Cliente:{' '}
              {client.data ? (
                <Link to={`/clients/${client.data.id}`} className="text-accent hover:underline">
                  {client.data.name}
                </Link>
              ) : (
                '—'
              )}
              {' · '}
              {p.areaM2 ? `${p.areaM2} m²` : 'sin área'}
              {p.scope ? ` · ${p.scope}` : ''}
            </div>
          </div>
          <ProjectStatusBadge status={p.status} />
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <ActionButton
          Icon={RefreshCw}
          label="Regenerar"
          busy={regenerate.isPending}
          onClick={() => regenerate.mutate()}
        />
        <ActionButton
          Icon={Sparkles}
          label="Refinar con IA"
          busy={refine.isPending}
          onClick={() => refine.mutate()}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Budget area */}
        <div className="space-y-6 min-w-0">
          {sortedBudgets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
              Sin presupuestos todavía.
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted">Versión:</span>
                  <select
                    value={selected?.id ?? ''}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                  >
                    {sortedBudgets.map((b) => (
                      <option key={b.id} value={b.id}>
                        v{b.version} ({b.status})
                      </option>
                    ))}
                  </select>
                  <span className="ml-2 text-muted">Comparar con:</span>
                  <select
                    value={compareWithId ?? ''}
                    onChange={(e) => setCompareWithId(e.target.value || null)}
                    className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                  >
                    <option value="">— ninguna —</option>
                    {sortedBudgets
                      .filter((b) => b.id !== selected?.id)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          v{b.version} ({b.status})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {selected && compareWith && (
                <div className="rounded-xl border border-border bg-surface p-5">
                  <BudgetVersionDiff
                    older={selected.version > compareWith.version ? compareWith : selected}
                    newer={selected.version > compareWith.version ? selected : compareWith}
                  />
                </div>
              )}

              {selected && (
                <div className="rounded-xl border border-border bg-surface p-5">
                  <BudgetViewer budget={selected} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <section className="rounded-xl border border-border bg-surface">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Clock className="h-4 w-4 text-muted" />
              <h2 className="text-sm font-medium">Actividad</h2>
            </div>
            <div className="max-h-80 overflow-y-auto px-4 py-3">
              <Timeline events={events.data ?? []} />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <MessageCircle className="h-4 w-4 text-muted" />
              <h2 className="text-sm font-medium">WhatsApp</h2>
            </div>
            <div className="max-h-96 overflow-y-auto px-4 py-3">
              {messages.data && messages.data.length > 0 ? (
                <ul className="space-y-3 text-sm">
                  {messages.data.map((m) => {
                    const inbound = m.direction === 'INBOUND';
                    return (
                      <li key={m.id} className={`flex ${inbound ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[85%] ${inbound ? '' : 'text-right'}`}>
                          <div className="mb-0.5 text-[10px] uppercase tracking-wide text-muted">
                            {inbound ? '← entrante' : 'saliente →'} · {fmtDateTime(m.createdAt)}
                          </div>
                          <div
                            className={`inline-block whitespace-pre-wrap rounded-lg px-3 py-2 text-left text-xs ${
                              inbound
                                ? 'bg-bg border border-border'
                                : 'bg-accent/10 text-ink border border-accent/20'
                            }`}
                          >
                            {m.body}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-sm text-muted">Sin mensajes.</div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  Icon: LucideIcon;
  label: string;
  busy: boolean;
  onClick: () => void;
}
function ActionButton({ Icon, label, busy, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium transition hover:border-accent hover:bg-accent/5 hover:text-accent disabled:opacity-50"
    >
      <Icon className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} strokeWidth={2} />
      {busy ? `${label}…` : label}
    </button>
  );
}
