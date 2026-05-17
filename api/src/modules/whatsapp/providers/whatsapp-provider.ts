/**
 * WhatsApp adapter contract. All outbound messaging goes through this — the rest
 * of the app never talks to Meta (or any provider) directly.
 *
 * Concrete providers:
 *  - MetaWhatsappProvider     — real Meta WhatsApp Cloud API (production)
 *  - ConsoleWhatsappProvider  — logs to stdout (local dev, before Meta is wired)
 */
export const WHATSAPP_PROVIDER = Symbol('WhatsappProvider');

export interface WhatsappProvider {
  /** Provider name for logs/diagnostics. */
  readonly name: 'meta' | 'console';
  /** Send a plain-text WhatsApp message to a number in E.164 (e.g. "+34600123456"). */
  sendText(toE164: string, body: string): Promise<void>;
}
