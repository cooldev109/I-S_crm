import type { BudgetStatus, ProjectStatus } from '@studio/shared';

/**
 * Coloured pill used across tables and detail views.
 * Colour map matches docs/design-system.md (gray/amber/green/red).
 */
const PROJECT_COLOR: Record<ProjectStatus, string> = {
  NEW: 'bg-stone-100 text-stone-700',
  BUDGETING: 'bg-amber-100 text-amber-800',
  PROPOSAL: 'bg-amber-100 text-amber-800',
  CONTRACT: 'bg-amber-100 text-amber-800',
  ACTIVE: 'bg-green-100 text-green-800',
  CLOSED: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-700',
};

const BUDGET_COLOR: Record<BudgetStatus, string> = {
  DRAFT: 'bg-stone-100 text-stone-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PROJECT_COLOR[status]}`}
    >
      {status}
    </span>
  );
}

export function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BUDGET_COLOR[status]}`}
    >
      {status}
    </span>
  );
}
