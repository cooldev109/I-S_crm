import type { BudgetStatus, ProjectStatus } from '@studio/shared';

/**
 * Coloured pill used across tables and detail views.
 * Colour map matches docs/design-system.md (gray/amber/green/red).
 */
const PROJECT_COLOR: Record<ProjectStatus, string> = {
  NEW: 'bg-stone-100 text-stone-700 ring-stone-200',
  BUDGETING: 'bg-amber-50 text-amber-800 ring-amber-200',
  PROPOSAL: 'bg-amber-50 text-amber-800 ring-amber-200',
  CONTRACT: 'bg-amber-50 text-amber-800 ring-amber-200',
  ACTIVE: 'bg-green-50 text-green-800 ring-green-200',
  CLOSED: 'bg-green-50 text-green-800 ring-green-200',
  LOST: 'bg-red-50 text-red-700 ring-red-200',
};

const BUDGET_COLOR: Record<BudgetStatus, string> = {
  DRAFT: 'bg-stone-100 text-stone-700 ring-stone-200',
  UNDER_REVIEW: 'bg-amber-50 text-amber-800 ring-amber-200',
  APPROVED: 'bg-green-50 text-green-800 ring-green-200',
};

const PROJECT_LABEL: Record<ProjectStatus, string> = {
  NEW: 'Nuevo',
  BUDGETING: 'Presupuestando',
  PROPOSAL: 'Propuesta',
  CONTRACT: 'Contrato',
  ACTIVE: 'Activo',
  CLOSED: 'Cerrado',
  LOST: 'Perdido',
};

const BUDGET_LABEL: Record<BudgetStatus, string> = {
  DRAFT: 'Borrador',
  UNDER_REVIEW: 'En revisión',
  APPROVED: 'Aprobado',
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${PROJECT_COLOR[status]}`}
    >
      <Dot status={status} />
      {PROJECT_LABEL[status]}
    </span>
  );
}

export function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${BUDGET_COLOR[status]}`}
    >
      <Dot status={status} />
      {BUDGET_LABEL[status]}
    </span>
  );
}

function Dot({ status }: { status: ProjectStatus | BudgetStatus }) {
  const colour =
    status === 'ACTIVE' || status === 'CLOSED' || status === 'APPROVED'
      ? 'bg-green-600'
      : status === 'LOST'
        ? 'bg-red-600'
        : status === 'BUDGETING' || status === 'PROPOSAL' || status === 'CONTRACT' || status === 'UNDER_REVIEW'
          ? 'bg-amber-500'
          : 'bg-stone-400';
  return <span className={`h-1.5 w-1.5 rounded-full ${colour}`} />;
}
