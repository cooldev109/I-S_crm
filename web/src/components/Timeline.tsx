import {
  UserPlus,
  FolderPlus,
  ArrowRightLeft,
  FileText,
  FileEdit,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  Circle,
  type LucideIcon,
} from 'lucide-react';
import type { EventDto } from '@studio/shared';
import { fmtDateTime } from '../lib/format';

interface EventStyle {
  label: string;
  Icon: LucideIcon;
  color: string;
}

const EVENTS: Record<string, EventStyle> = {
  'client.created': { label: 'Cliente creado', Icon: UserPlus, color: 'text-accent bg-accent/10' },
  'project.created': { label: 'Proyecto creado', Icon: FolderPlus, color: 'text-accent bg-accent/10' },
  'project.status_changed': {
    label: 'Estado del proyecto cambiado',
    Icon: ArrowRightLeft,
    color: 'text-amber-700 bg-amber-50',
  },
  'budget.generated': { label: 'Presupuesto generado', Icon: FileText, color: 'text-stone-700 bg-stone-100' },
  'budget.revised': { label: 'Presupuesto revisado', Icon: FileEdit, color: 'text-amber-700 bg-amber-50' },
  'budget.approved': {
    label: 'Presupuesto aprobado',
    Icon: CheckCircle2,
    color: 'text-green-700 bg-green-50',
  },
  'whatsapp.received': {
    label: 'WhatsApp recibido',
    Icon: ArrowDownLeft,
    color: 'text-stone-600 bg-stone-100',
  },
  'whatsapp.sent': {
    label: 'WhatsApp enviado',
    Icon: ArrowUpRight,
    color: 'text-stone-600 bg-stone-100',
  },
};

/** Vertical event timeline for the project detail page. */
export function Timeline({ events }: { events: EventDto[] }) {
  if (events.length === 0) {
    return <div className="text-sm text-muted">Sin actividad todavía.</div>;
  }
  return (
    <ol className="relative space-y-3 border-l border-border pl-4">
      {events.map((e) => {
        const style = EVENTS[e.type] ?? { label: e.type, Icon: Circle, color: 'text-muted bg-bg' };
        const { Icon } = style;
        return (
          <li key={e.id} className="relative">
            <span
              className={`absolute -left-[26px] flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-surface ${style.color}`}
            >
              <Icon className="h-3 w-3" strokeWidth={2.5} />
            </span>
            <div className="text-sm leading-tight">
              <div className="font-medium">{style.label}</div>
              <div className="mt-0.5 text-xs text-muted">{fmtDateTime(e.createdAt)}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
