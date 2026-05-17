import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappProvider } from './whatsapp-provider';

/**
 * Meta WhatsApp Cloud API client. Uses the Graph API v20 messages endpoint.
 * Constructed only when WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID are
 * both set; otherwise the ConsoleWhatsappProvider is selected at module init.
 */
@Injectable()
export class MetaWhatsappProvider implements WhatsappProvider {
  readonly name = 'meta' as const;
  private readonly logger = new Logger('Whatsapp/Meta');
  private readonly token: string;
  private readonly phoneNumberId: string;

  constructor(config: ConfigService) {
    this.token = config.getOrThrow<string>('WHATSAPP_ACCESS_TOKEN');
    this.phoneNumberId = config.getOrThrow<string>('WHATSAPP_PHONE_NUMBER_ID');
  }

  async sendText(toE164: string, body: string): Promise<void> {
    const url = `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toE164.replace(/^\+/, ''),
        type: 'text',
        text: { body, preview_url: false },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '<no body>');
      this.logger.error(`Meta send failed ${res.status}: ${text}`);
      throw new InternalServerErrorException('WhatsApp provider error');
    }
  }
}
