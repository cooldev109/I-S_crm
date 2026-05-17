import { Controller, Get } from '@nestjs/common';
import { BudgetStatus, ProjectStatus } from '@prisma/client';
import { DashboardSummaryDto, EventDto } from '@studio/shared';
import { PrismaService } from '../../core/prisma/prisma.service';

/**
 * Single endpoint that powers the admin home page. Keeps round-trips down
 * by aggregating counts + recent activity in one DB hit each.
 */
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('summary')
  async summary(): Promise<DashboardSummaryDto> {
    const [clients, projects, projectsGrouped, approvedBudgets, draftBudgets, events] =
      await Promise.all([
        this.prisma.client.count(),
        this.prisma.project.count(),
        this.prisma.project.groupBy({ by: ['status'], _count: { _all: true } }),
        this.prisma.budget.count({ where: { status: BudgetStatus.APPROVED } }),
        this.prisma.budget.count({ where: { status: BudgetStatus.DRAFT } }),
        this.prisma.event.findMany({
          orderBy: { createdAt: 'desc' },
          take: 25,
        }),
      ]);

    const projectsByStatus = Object.values(ProjectStatus).reduce(
      (acc, s) => ({ ...acc, [s]: 0 }),
      {} as Record<ProjectStatus, number>,
    );
    for (const row of projectsGrouped) {
      projectsByStatus[row.status] = row._count._all;
    }

    return {
      counts: {
        clients,
        projects,
        projectsByStatus,
        budgetsApproved: approvedBudgets,
        budgetsDraft: draftBudgets,
      },
      recentEvents: events.map(
        (e): EventDto => ({
          id: e.id,
          type: e.type,
          projectId: e.projectId,
          userId: e.userId,
          payload: e.payload,
          createdAt: e.createdAt.toISOString(),
        }),
      ),
    };
  }
}
