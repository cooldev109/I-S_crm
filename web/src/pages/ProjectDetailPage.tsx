import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
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
    mutationFn: () => api.post(`/projects/${id}/budgets/generate`),
    onSuccess: refreshAll,
  });
  const refine = useMutation({
    mutationFn: () => api.post<BudgetDto & { usedAi: boolean }>(`/projects/${id}/budgets/refine`),
    onSuccess: refreshAll,
  });

  const sortedBudgets = (budgets.data ?? []).slice().sort((a, b) => b.version - a.version);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    sortedBudgets.find((b) => b.id === selectedId) ?? sortedBudgets[0] ?? null;
  const [compareWithId, setCompareWithId] = useState<string | null>(null);
  const compareWith = sortedBudgets.find((b) => b.id === compareWithId) ?? null;

  if (project.isLoading) return <div className="text-sm text-muted">Cargando…</div>;
  if (project.isError || !project.data)
    return <div className="text-sm text-status-error">Proyecto no encontrado.</div>;

  const p = project.data;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/projects" className="text-sm text-muted hover:text-accent">
          ← Proyectos
        </Link>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <h1 className="text-xl font-semibold">
            {p.type}{' '}
            <span className="text-base font-normal text-muted">· {p.id.slice(-6)}</span>
          </h1>
          <ProjectStatusBadge status={p.status} />
        </div>
        <div className="mt-1 text-sm text-muted">
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

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => regenerate.mutate()}
          disabled={regenerate.isPending}
          className="rounded border border-border bg-surface px-3 py-1.5 text-sm hover:border-accent disabled:opacity-50"
        >
          {regenerate.isPending ? 'Regenerando…' : 'Regenerar borrador'}
        </button>
        <button
          onClick={() => refine.mutate()}
          disabled={refine.isPending}
          className="rounded border border-border bg-surface px-3 py-1.5 text-sm hover:border-accent disabled:opacity-50"
        >
          {refine.isPending ? 'Refinando…' : 'Refinar con IA'}
        </button>
        {refine.data && (
          <span className="self-center text-xs text-muted">
            {refine.data.usedAi ? 'IA aplicada' : 'IA no configurada — sin cambios'}
          </span>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {sortedBudgets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
              Sin presupuestos todavía.
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-surface p-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted">Versión:</span>
                  <select
                    value={selected?.id ?? ''}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="rounded border border-border bg-surface px-2 py-1"
                  >
                    {sortedBudgets.map((b) => (
                      <option key={b.id} value={b.id}>
                        v{b.version} ({b.status})
                      </option>
                    ))}
                  </select>
                  <span className="ml-3 text-muted">Comparar con:</span>
                  <select
                    value={compareWithId ?? ''}
                    onChange={(e) => setCompareWithId(e.target.value || null)}
                    className="rounded border border-border bg-surface px-2 py-1"
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
                <div className="rounded-lg border border-border bg-surface p-4">
                  <BudgetVersionDiff
                    older={
                      selected.version > compareWith.version ? compareWith : selected
                    }
                    newer={
                      selected.version > compareWith.version ? selected : compareWith
                    }
                  />
                </div>
              )}
              {selected && (
                <div className="rounded-lg border border-border bg-surface p-4">
                  <BudgetViewer budget={selected} />
                </div>
              )}
            </>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-medium text-muted">Actividad</h2>
            <Timeline events={events.data ?? []} />
          </section>

          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-medium text-muted">WhatsApp</h2>
            {messages.data && messages.data.length > 0 ? (
              <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
                {messages.data.map((m) => (
                  <li key={m.id}>
                    <div className="text-xs text-muted">
                      {m.direction === 'INBOUND' ? '← ' : '→ '}
                      {fmtDateTime(m.createdAt)}
                    </div>
                    <div className="whitespace-pre-wrap rounded border border-border bg-bg p-2">
                      {m.body}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted">Sin mensajes.</div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
