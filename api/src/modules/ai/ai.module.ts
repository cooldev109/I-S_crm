import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BudgetRefinerService } from './budget-refiner.service';
import { OPENAI_PROVIDER, OpenAiProvider } from './openai.provider';
import { OpenAiRealProvider } from './openai-real.provider';
import { OpenAiNoopProvider } from './openai-noop.provider';

/**
 * Provider selection: real OpenAI when OPENAI_API_KEY is present, no-op
 * otherwise. The no-op path keeps the budget flow working when the studio
 * hasn't shipped a key yet — AI refinement is additive, not required.
 */
const providerFactory = {
  provide: OPENAI_PROVIDER,
  useFactory: (config: ConfigService): OpenAiProvider => {
    const provider = config.get<string>('OPENAI_API_KEY')
      ? new OpenAiRealProvider(config)
      : new OpenAiNoopProvider();
    new Logger('AiModule').log(`Using OpenAI provider: ${provider.name}`);
    return provider;
  },
  inject: [ConfigService],
};

@Module({
  providers: [BudgetRefinerService, providerFactory],
  exports: [BudgetRefinerService],
})
export class AiModule {}
