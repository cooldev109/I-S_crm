/** Domain enums — mirrored in the Prisma schema. */

export const ProjectType = {
  REFORMA_INTEGRAL: 'REFORMA_INTEGRAL',
  REFORMA_PARCIAL: 'REFORMA_PARCIAL',
  INTERIORISMO: 'INTERIORISMO',
  ESTUDIO_PREVIO: 'ESTUDIO_PREVIO',
  OTRO: 'OTRO',
} as const;
export type ProjectType = (typeof ProjectType)[keyof typeof ProjectType];

export const ProjectStatus = {
  NEW: 'NEW',
  BUDGETING: 'BUDGETING',
  PROPOSAL: 'PROPOSAL',
  CONTRACT: 'CONTRACT',
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
  LOST: 'LOST',
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const BudgetStatus = {
  DRAFT: 'DRAFT',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
} as const;
export type BudgetStatus = (typeof BudgetStatus)[keyof typeof BudgetStatus];

export const MessageDirection = {
  INBOUND: 'INBOUND',
  OUTBOUND: 'OUTBOUND',
} as const;
export type MessageDirection = (typeof MessageDirection)[keyof typeof MessageDirection];

export const UserRole = {
  ADMIN: 'ADMIN',
  STUDIO: 'STUDIO',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Internal event names written to the `events` audit table. */
export const EventType = {
  CLIENT_CREATED: 'client.created',
  PROJECT_CREATED: 'project.created',
  PROJECT_STATUS_CHANGED: 'project.status_changed',
  BUDGET_GENERATED: 'budget.generated',
  BUDGET_REVISED: 'budget.revised',
  BUDGET_APPROVED: 'budget.approved',
  WHATSAPP_RECEIVED: 'whatsapp.received',
  WHATSAPP_SENT: 'whatsapp.sent',
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];
