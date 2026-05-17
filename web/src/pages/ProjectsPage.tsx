import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { ProjectDto } from '@studio/shared';
import { api } from '../lib/api';
import { fmtDateTime } from '../lib/format';
import { ProjectStatusBadge } from '../components/StatusBadge';

export function ProjectsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<ProjectDto[]>('/projects'),
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Proyectos</h1>
      <div className="rounded-lg border border-border bg-surface">
        {isLoading && <div className="p-4 text-sm text-muted">Cargando…</div>}
        {isError && <div className="p-4 text-sm text-status-error">No se pudo cargar.</div>}
        {data && data.length === 0 && (
          <div className="p-6 text-center text-sm text-muted">
            Aún no hay proyectos. Crea uno desde WhatsApp.
          </div>
        )}
        {data && data.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2 text-right">m²</th>
                <th className="px-4 py-2">Alcance</th>
                <th className="px-4 py-2">Creado</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-bg">
                  <td className="px-4 py-2 font-mono text-xs">
                    <Link to={`/projects/${p.id}`} className="text-accent hover:underline">
                      {p.id.slice(-6)}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{p.type}</td>
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
