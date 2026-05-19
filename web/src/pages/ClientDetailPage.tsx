import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FolderKanban } from 'lucide-react';
import type { ClientDto, ProjectDto } from '@studio/shared';
import { api } from '../lib/api';
import { fmtDateTime } from '../lib/format';
import { ProjectStatusBadge } from '../components/StatusBadge';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const clientQ = useQuery({
    queryKey: ['client', id],
    queryFn: () => api.get<ClientDto>(`/clients/${id}`),
    enabled: !!id,
  });
  const projectsQ = useQuery({
    queryKey: ['projects', { clientId: id }],
    queryFn: () => api.get<ProjectDto[]>(`/projects?clientId=${id}`),
    enabled: !!id,
  });

  if (clientQ.isLoading) return <div className="text-sm text-muted">Cargando…</div>;
  if (clientQ.isError || !clientQ.data)
    return <div className="text-sm text-status-error">Cliente no encontrado.</div>;

  const client = clientQ.data;
  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/clients"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Clientes
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{client.name}</h1>
        <div className="mt-1 text-sm text-muted">
          {client.contact}
          {client.source && (
            <>
              {' · '}
              <span className="rounded-full bg-bg px-2 py-0.5 text-xs">{client.source}</span>
            </>
          )}
          {' · '}
          creado {fmtDateTime(client.createdAt)}
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium">Proyectos</h2>
        </div>
        {projectsQ.isLoading && <div className="p-6 text-sm text-muted">Cargando…</div>}
        {projectsQ.data && projectsQ.data.length === 0 && (
          <div className="flex flex-col items-center gap-3 p-10 text-center text-sm text-muted">
            <FolderKanban className="h-8 w-8 text-muted/40" />
            <div>Sin proyectos aún.</div>
          </div>
        )}
        {projectsQ.data && projectsQ.data.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 text-right font-medium">m²</th>
                <th className="px-5 py-3 font-medium">Alcance</th>
                <th className="px-5 py-3 font-medium">Creado</th>
              </tr>
            </thead>
            <tbody>
              {projectsQ.data.map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-b border-border last:border-0 ${
                    i % 2 === 1 ? 'bg-bg/40' : ''
                  } transition-colors hover:bg-bg`}
                >
                  <td className="px-5 py-3">
                    <Link to={`/projects/${p.id}`} className="font-medium text-accent hover:underline">
                      {p.type}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <ProjectStatusBadge status={p.status} />
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{p.areaM2 ?? '—'}</td>
                  <td className="px-5 py-3 text-muted">{p.scope ?? '—'}</td>
                  <td className="px-5 py-3 text-xs text-muted">{fmtDateTime(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
