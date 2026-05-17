import { IsString, MinLength } from 'class-validator';

/**
 * Used by the admin-only POST /whatsapp/simulate endpoint to inject a fake
 * inbound message without needing Meta. Invaluable for local testing and for
 * the studio to test the bot from the admin panel when WhatsApp is down.
 */
export class SimulateInboundDto {
  /** Sender's WhatsApp number, E.164 (e.g. "+34600123456"). */
  @IsString()
  @MinLength(4)
  from: string;

  @IsString()
  @MinLength(1)
  body: string;
}
