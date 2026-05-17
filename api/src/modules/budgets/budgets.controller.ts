import { Controller, Get, Param, Post } from '@nestjs/common';
import { BudgetDto } from '@studio/shared';
import { BudgetsService } from './budgets.service';

/**
 * Read-only HTTP surface for budgets (plus a manual regenerate trigger).
 * Adjustments happen via WhatsApp — see WhatsappService — not via REST.
 */
@Controller()
export class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}

  @Get('projects/:projectId/budgets')
  async list(@Param('projectId') projectId: string): Promise<BudgetDto[]> {
    const all = await this.budgets.list(projectId);
    return all.map(BudgetsService.toDto);
  }

  @Get('projects/:projectId/budgets/latest')
  async latest(@Param('projectId') projectId: string): Promise<BudgetDto | null> {
    const b = await this.budgets.getLatest(projectId);
    return b ? BudgetsService.toDto(b) : null;
  }

  @Post('projects/:projectId/budgets/generate')
  async generate(@Param('projectId') projectId: string): Promise<BudgetDto> {
    return BudgetsService.toDto(await this.budgets.generateForProject(projectId));
  }

  @Post('projects/:projectId/budgets/refine')
  async refine(@Param('projectId') projectId: string): Promise<BudgetDto & { usedAi: boolean }> {
    const r = await this.budgets.refineForProject(projectId);
    return { ...BudgetsService.toDto(r.budget), usedAi: r.usedAi };
  }

  @Get('budgets/:id')
  async findOne(@Param('id') id: string): Promise<BudgetDto> {
    return BudgetsService.toDto(await this.budgets.findOne(id));
  }
}
