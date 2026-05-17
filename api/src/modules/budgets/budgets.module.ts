import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { AiModule } from '../ai/ai.module';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { BudgetGeneratorService } from './generator/budget-generator.service';

@Module({
  imports: [ProjectsModule, AiModule],
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetGeneratorService],
  exports: [BudgetsService, BudgetGeneratorService],
})
export class BudgetsModule {}
