import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import type { ClientDto } from '@studio/shared';
import { api } from '../lib/api';
import { fmtDateTime } from '../lib/format';

export function ClientsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get<ClientDto[]>('/clients'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-muted">
            {data ? `${data.length} cliente${data.length === 1 ? '' : 's'}` : ' '}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {isLoading && <div className="p-6 text-sm text-muted">Cargando…</div>}
        {isError && <div className="p-6 text-sm text-status-error">No se pudo cargar.</div>}
        {data && data.length === 0 && (
          <div className="flex flex-col items-center gap-3 p-12 text-center text-sm text-muted">
            <Users className="h-10 w-10 text-muted/40" />
            <div>
              Aún no hay clientes.
              <br />
              <span className="text-xs">Crea uno enviando un mensaje al bot por WhatsApp.</span>
            </div>
          </div>
        )}
        {data && data.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Contacto</th>
                <th className="px-5 py-3 font-medium">Origen</th>
                <th className="px-5 py-3 font-medium">Creado</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-border last:border-0 ${
                    i % 2 === 1 ? 'bg-bg/40' : ''
                  } transition-colors hover:bg-bg`}
                >
                  <td className="px-5 py-3 font-medium">
                    <Link to={`/clients/${c.id}`} className="text-accent hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted">{c.contact}</td>
                  <td className="px-5 py-3">
                    {c.source ? (
                      <span className="rounded-full bg-bg px-2 py-0.5 text-xs text-muted">
                        {c.source}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">{fmtDateTime(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
