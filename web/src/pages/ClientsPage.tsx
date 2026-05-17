import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { ClientDto } from '@studio/shared';
import { api } from '../lib/api';
import { fmtDateTime } from '../lib/format';

export function ClientsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get<ClientDto[]>('/clients'),
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Clientes</h1>
      <div className="rounded-lg border border-border bg-surface">
        {isLoading && <div className="p-4 text-sm text-muted">Cargando…</div>}
        {isError && <div className="p-4 text-sm text-status-error">No se pudo cargar.</div>}
        {data && data.length === 0 && (
          <div className="p-6 text-center text-sm text-muted">
            Aún no hay clientes. Crea uno desde WhatsApp.
          </div>
        )}
        {data && data.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Contacto</th>
                <th className="px-4 py-2">Origen</th>
                <th className="px-4 py-2">Creado</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-bg">
                  <td className="px-4 py-2">
                    <Link to={`/clients/${c.id}`} className="text-accent hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{c.contact}</td>
                  <td className="px-4 py-2 text-muted">{c.source ?? '—'}</td>
                  <td className="px-4 py-2 text-muted">{fmtDateTime(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
