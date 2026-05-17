import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventType } from '@studio/shared';
import { PrismaService } from '../../core/prisma/prisma.service';

interface RecordParams {
  type: EventType;
  projectId?: string | null;
  userId?: string | null;
  payload?: Prisma.InputJsonValue;
}

/**
 * Single writer for the `events` audit trail. Every meaningful state change
 * goes through here. Never throws — a failure to write an audit row should
 * not bring down the calling flow (logged instead).
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(params: RecordParams): Promise<void> {
    try {
      await this.prisma.event.create({
        data: {
          type: params.type,
          projectId: params.projectId ?? null,
          userId: params.userId ?? null,
          payload: params.payload ?? Prisma.JsonNull,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to record event ${params.type}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
