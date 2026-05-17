import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAiProvider } from './openai.provider';

interface ChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

@Injectable()
export class OpenAiRealProvider implements OpenAiProvider {
  readonly name = 'openai' as const;
  private readonly logger = new Logger('OpenAI');
  private readonly key: string;
  private readonly model: string;

  constructor(config: ConfigService) {
    this.key = config.getOrThrow<string>('OPENAI_API_KEY');
    this.model = config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
  }

  async complete({
    system,
    user,
    maxTokens,
  }: {
    system: string;
    user: string;
    maxTokens?: number;
  }): Promise<string | null> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: maxTokens ?? 2000,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '<no body>');
      this.logger.error(`OpenAI ${res.status}: ${text}`);
      return null;
    }
    const data = (await res.json()) as ChatResponse;
    return data.choices?.[0]?.message?.content ?? null;
  }
}
