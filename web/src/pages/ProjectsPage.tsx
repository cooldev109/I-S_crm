import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FolderKanban } from 'lucide-react';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Proyectos</h1>
        <p className="mt-1 text-sm text-muted">
          {data ? `${data.length} proyecto${data.length === 1 ? '' : 's'}` : ' '}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {isLoading && <div className="p-6 text-sm text-muted">Cargando…</div>}
        {isError && <div className="p-6 text-sm text-status-error">No se pudo cargar.</div>}
        {data && data.length === 0 && (
          <div className="flex flex-col items-center gap-3 p-12 text-center text-sm text-muted">
            <FolderKanban className="h-10 w-10 text-muted/40" />
            <div>
              Aún no hay proyectos.
              <br />
              <span className="text-xs">Crea uno enviando un mensaje al bot por WhatsApp.</span>
            </div>
          </div>
        )}
        {data && data.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 text-right font-medium">m²</th>
                <th className="px-5 py-3 font-medium">Alcance</th>
                <th className="px-5 py-3 font-medium">Creado</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-b border-border last:border-0 ${
                    i % 2 === 1 ? 'bg-bg/40' : ''
                  } transition-colors hover:bg-bg`}
                >
                  <td className="px-5 py-3 font-mono text-xs">
                    <Link to={`/projects/${p.id}`} className="text-accent hover:underline">
                      {p.id.slice(-6)}
                    </Link>
                  </td>
                  <td className="px-5 py-3 font-medium">{p.type}</td>
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
      </div>
    </div>
  );
}
