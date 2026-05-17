import { Injectable, Logger } from '@nestjs/common';
import { WhatsappProvider } from './whatsapp-provider';

/**
 * Dev provider: prints outbound messages to the API log instead of sending them.
 * Selected automatically when Meta credentials are missing — keeps the entire
 * flow runnable end-to-end before the studio's Meta Business account is approved.
 */
@Injectable()
export class ConsoleWhatsappProvider implements WhatsappProvider {
  readonly name = 'console' as const;
  private readonly logger = new Logger('Whatsapp/Console');

  async sendText(toE164: string, body: string): Promise<void> {
    this.logger.log(`-> ${toE164}\n${body}`);
  }
}
