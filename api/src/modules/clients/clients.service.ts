import { Injectable, NotFoundException } from '@nestjs/common';
import { Client, Prisma } from '@prisma/client';
import { ClientDto, EventType } from '@studio/shared';
import { PrismaService } from '../../core/prisma/prisma.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async create(data: Prisma.ClientCreateInput): Promise<Client> {
    const client = await this.prisma.client.create({ data });
    await this.events.record({
      type: EventType.CLIENT_CREATED,
      payload: { clientId: client.id, name: client.name, source: client.source ?? null },
    });
    return client;
  }

  list(): Promise<Client[]> {
    return this.prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException(`Client ${id} not found`);
    return client;
  }

  update(id: string, data: Prisma.ClientUpdateInput): Promise<Client> {
    return this.prisma.client.update({ where: { id }, data });
  }

  remove(id: string): Promise<Client> {
    return this.prisma.client.delete({ where: { id } });
  }

  static toDto(client: Client): ClientDto {
    return {
      id: client.id,
      name: client.name,
      contact: client.contact,
      source: client.source,
      createdAt: client.createdAt.toISOString(),
    };
  }
}
