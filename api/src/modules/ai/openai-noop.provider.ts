import { Injectable, Logger } from '@nestjs/common';
import { OpenAiProvider } from './openai.provider';

/**
 * Used when OPENAI_API_KEY is not configured. Returns null so callers fall
 * back to whatever non-AI path they have (for the budget refiner, that means
 * the rule-based draft is left as-is).
 */
@Injectable()
export class OpenAiNoopProvider implements OpenAiProvider {
  readonly name = 'noop' as const;
  private readonly logger = new Logger('OpenAI/Noop');

  async complete(): Promise<string | null> {
    this.logger.debug('OpenAI call skipped (no API key configured)');
    return null;
  }
}
