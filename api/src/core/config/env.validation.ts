/**
 * Validates required environment variables at boot. Fails fast with a clear
 * message rather than crashing later with a cryptic error.
 *
 * Integration credentials (WhatsApp, OpenAI) are intentionally NOT required
 * here — the app should boot without them; the relevant module errors only
 * when actually exercised.
 */
export interface AppEnv {
  NODE_ENV: string;
  API_PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  WEB_ORIGIN: string;
  // WhatsApp — provider auto-selected: 'meta' when credentials present,
  // 'console' (logs outbound messages to stdout) otherwise. Lets the system
  // run end-to-end in dev before the studio's Meta Business account is approved.
  WHATSAPP_VERIFY_TOKEN: string;
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
}

export function validateEnv(raw: Record<string, unknown>): AppEnv {
  const required = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET'] as const;
  const missing = required.filter((k) => !raw[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    NODE_ENV: String(raw.NODE_ENV ?? 'development'),
    API_PORT: Number(raw.API_PORT ?? 1109),
    DATABASE_URL: String(raw.DATABASE_URL),
    REDIS_URL: String(raw.REDIS_URL),
    JWT_SECRET: String(raw.JWT_SECRET),
    JWT_EXPIRES_IN: String(raw.JWT_EXPIRES_IN ?? '7d'),
    WEB_ORIGIN: String(raw.WEB_ORIGIN ?? 'http://localhost:1995'),
    WHATSAPP_VERIFY_TOKEN: String(raw.WHATSAPP_VERIFY_TOKEN ?? ''),
    WHATSAPP_ACCESS_TOKEN: String(raw.WHATSAPP_ACCESS_TOKEN ?? ''),
    WHATSAPP_PHONE_NUMBER_ID: String(raw.WHATSAPP_PHONE_NUMBER_ID ?? ''),
  };
}
