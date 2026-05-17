/**
 * Thin Chat Completions client. Isolates the OpenAI API behind a single call
 * so the rest of the app never imports the SDK — keeps the integration
 * adapter-shaped per the architectural rules.
 *
 * Two implementations selected at module init:
 *   - OpenAiProvider          — real call to api.openai.com (when key present)
 *   - NoopOpenAiProvider      — returns null so callers fall back gracefully
 *
 * Why a "noop" instead of throwing? The studio's setup may take days to ship
 * an API key. The system should still produce rule-based budgets without it;
 * AI refinement is additive.
 */
export const OPENAI_PROVIDER = Symbol('OpenAiProvider');

export interface OpenAiProvider {
  readonly name: 'openai' | 'noop';
  /** Returns the model's response text, or null if not available. */
  complete(input: { system: string; user: string; maxTokens?: number }): Promise<string | null>;
}
