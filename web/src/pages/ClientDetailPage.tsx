import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
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
    <div className="space-y-5">
      <div>
        <Link to="/clients" className="text-sm text-muted hover:text-accent">
          ← Clientes
        </Link>
        <h1 className="mt-2 text-xl font-semibold">{client.name}</h1>
        <div className="mt-1 text-sm text-muted">
          {client.contact} · origen {client.source ?? '—'} · creado {fmtDateTime(client.createdAt)}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-4 py-2 text-sm font-medium">Proyectos</div>
        {projectsQ.isLoading && <div className="p-4 text-sm text-muted">Cargando…</div>}
        {projectsQ.data && projectsQ.data.length === 0 && (
          <div className="p-4 text-sm text-muted">Sin proyectos aún.</div>
        )}
        {projectsQ.data && projectsQ.data.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted">
                <th className="px-4 py-2 text-left">Tipo</th>
                <th className="px-4 py-2 text-left">Estado</th>
                <th className="px-4 py-2 text-right">m²</th>
                <th className="px-4 py-2 text-left">Alcance</th>
                <th className="px-4 py-2 text-left">Creado</th>
              </tr>
            </thead>
            <tbody>
              {projectsQ.data.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-bg">
                  <td className="px-4 py-2">
                    <Link to={`/projects/${p.id}`} className="text-accent hover:underline">
                      {p.type}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <ProjectStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-2 text-right">{p.areaM2 ?? '—'}</td>
                  <td className="px-4 py-2">{p.scope ?? '—'}</td>
                  <td className="px-4 py-2 text-muted">{fmtDateTime(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
