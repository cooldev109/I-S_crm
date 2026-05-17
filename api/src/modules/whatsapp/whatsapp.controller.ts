import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { Public } from '../auth/public.decorator';
import { WhatsappService } from './whatsapp.service';
import { SimulateInboundDto } from './dto/simulate.dto';

/**
 * Meta WhatsApp webhook handler + admin-only simulation endpoint.
 *
 *   GET  /api/whatsapp/webhook  — Meta verification handshake (hub.challenge)
 *   POST /api/whatsapp/webhook  — Meta inbound event payload
 *   POST /api/whatsapp/simulate — Admin-only: inject a fake inbound message
 *                                  (useful for local dev before Meta is wired)
 */
@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly whatsapp: WhatsappService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Meta verification. Meta sends GET ?hub.mode=subscribe&hub.verify_token=…&hub.challenge=…
   * We echo back the challenge if the token matches.
   */
  @Public()
  @Get('webhook')
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expected = this.config.get<string>('WHATSAPP_VERIFY_TOKEN', '');
    if (mode === 'subscribe' && expected && token === expected) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  /**
   * Meta inbound event. Always acknowledged 200 — the actual processing is
   * fire-and-forget so Meta doesn't retry on slow handling.
   */
  @Public()
  @Post('webhook')
  async receive(@Body() payload: MetaInboundPayload): Promise<{ ok: true }> {
    try {
      for (const entry of payload?.entry ?? []) {
        for (const change of entry.changes ?? []) {
          for (const msg of change.value?.messages ?? []) {
            const from = `+${msg.from}`;
            const body = msg.text?.body ?? '';
            if (!body) continue;
            // Don't await — Meta only cares we received it.
            void this.whatsapp.handleInbound(from, body, payload);
          }
        }
      }
    } catch (err) {
      this.logger.error(
        'Webhook processing error',
        err instanceof Error ? err.stack : String(err),
      );
    }
    return { ok: true };
  }

  /**
   * Admin-only test injection. Requires a valid JWT (the global guard handles
   * that). Returns 200 once processing is complete (unlike the real webhook
   * which is async) so test scripts can read the resulting state immediately.
   */
  @Post('simulate')
  async simulate(@Body() dto: SimulateInboundDto): Promise<{ ok: true }> {
    if (!dto.from || !dto.body) {
      throw new BadRequestException('from and body required');
    }
    await this.whatsapp.handleInbound(dto.from, dto.body);
    return { ok: true };
  }
}

// --- Meta webhook payload shape (only the bits we use) ----------------------
interface MetaInboundPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from: string;
          text?: { body: string };
        }>;
      };
    }>;
  }>;
}
