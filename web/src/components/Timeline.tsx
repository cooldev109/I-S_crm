import type { EventDto } from '@studio/shared';
import { fmtDateTime } from '../lib/format';

const LABELS: Record<string, string> = {
  'client.created': 'Cliente creado',
  'project.created': 'Proyecto creado',
  'project.status_changed': 'Estado del proyecto cambiado',
  'budget.generated': 'Presupuesto generado',
  'budget.revised': 'Presupuesto revisado',
  'budget.approved': 'Presupuesto aprobado',
  'whatsapp.received': 'Mensaje WhatsApp recibido',
  'whatsapp.sent': 'Mensaje WhatsApp enviado',
};

/** Vertical event timeline for the project detail page. */
export function Timeline({ events }: { events: EventDto[] }) {
  if (events.length === 0) {
    return <div className="text-sm text-muted">Sin actividad todavía.</div>;
  }
  return (
    <ol className="space-y-3">
      {events.map((e) => (
        <li key={e.id} className="flex gap-3">
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
          <div className="text-sm">
            <div className="font-medium">{LABELS[e.type] ?? e.type}</div>
            <div className="text-xs text-muted">{fmtDateTime(e.createdAt)}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
