import type {
  BudgetStatus,
  MessageDirection,
  ProjectStatus,
  ProjectType,
  UserRole,
} from './enums.js';

/** Auth */
export interface LoginRequest {
  email: string;
  password: string;
}
export interface LoginResponse {
  token: string;
  user: UserDto;
}
export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/** Clients */
export interface ClientDto {
  id: string;
  name: string;
  contact: string;
  source: string | null;
  createdAt: string;
}

/** Projects */
export interface ProjectDto {
  id: string;
  clientId: string;
  type: ProjectType;
  status: ProjectStatus;
  areaM2: number | null;
  scope: string | null;
  createdAt: string;
}

/**
 * Budget structure — hierarchical chapter -> item, mirroring the studio's real
 * "Presupuesto Estimativo" documents (see docs/client-data-analysis.md).
 */
export type BudgetUnit = 'M2' | 'ML' | 'UD' | 'un' | string;

export interface BudgetItem {
  /** Dotted code, e.g. "1.1", "6.9". */
  code: string;
  unit: BudgetUnit;
  description: string;
  quantity: number;
  unitPrice: number;
  /** quantity * unitPrice, sin IVA. */
  total: number;
}

export interface BudgetChapter {
  /** Single number as string, e.g. "1", "13". */
  code: string;
  /** e.g. "TRABAJOS PREVIOS/DEMOLICIONES". */
  title: string;
  items: BudgetItem[];
}

export interface BudgetDto {
  id: string;
  projectId: string;
  version: number;
  status: BudgetStatus;
  chapters: BudgetChapter[];
  /** PEM = sum of all items across chapters. Sin IVA. */
  pemTotal: number;
  /** Honorarios percentage applied to PEM (e.g. 0.15). */
  feePercent: number;
  /** Minimum honorarios amount, in euros, sin IVA. */
  feeMinAmount: number;
  /** Computed: max(pemTotal * feePercent, feeMinAmount). */
  feeAmount: number;
  /** Base imponible = pemTotal + feeAmount. Sin IVA. */
  taxBaseTotal: number;
  notes: string | null;
  createdAt: string;
}

/** Messages */
export interface MessageDto {
  id: string;
  clientId: string | null;
  projectId: string | null;
  direction: MessageDirection;
  waNumber: string;
  body: string;
  createdAt: string;
}

/** Events — append-only audit trail. */
export interface EventDto {
  id: string;
  type: string;
  projectId: string | null;
  userId: string | null;
  payload: unknown;
  createdAt: string;
}

/** Dashboard summary — shown on the admin home page. */
export interface DashboardSummaryDto {
  counts: {
    clients: number;
    projects: number;
    projectsByStatus: Record<ProjectStatus, number>;
    budgetsApproved: number;
    budgetsDraft: number;
  };
  recentEvents: EventDto[];
}

/**
 * Structured result of parsing an inbound WhatsApp message.
 * The parser confirms this back to the studio before any action is taken.
 */
export interface ParsedIntakeMessage {
  clientName: string;
  contact: string;
  projectType: ProjectType;
  areaM2: number | null;
  scope: string | null;
}
