import { Injectable, NotFoundException } from '@nestjs/common';
import { Event, Message, Prisma, Project, ProjectStatus } from '@prisma/client';
import { EventDto, EventType, MessageDto, ProjectDto } from '@studio/shared';
import { PrismaService } from '../../core/prisma/prisma.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async create(data: Prisma.ProjectUncheckedCreateInput): Promise<Project> {
    const project = await this.prisma.project.create({ data });
    await this.events.record({
      type: EventType.PROJECT_CREATED,
      projectId: project.id,
      payload: { clientId: project.clientId, type: project.type, areaM2: project.areaM2 ?? null },
    });
    return project;
  }

  list(filter?: { clientId?: string }): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: filter?.clientId ? { clientId: filter.clientId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    const before = await this.findOne(id);
    const after = await this.prisma.project.update({ where: { id }, data });
    if (data.status && before.status !== after.status) {
      await this.events.record({
        type: EventType.PROJECT_STATUS_CHANGED,
        projectId: id,
        payload: { from: before.status, to: after.status },
      });
    }
    return after;
  }

  remove(id: string): Promise<Project> {
    return this.prisma.project.delete({ where: { id } });
  }

  /** Convenience used by the WhatsApp intake to advance a project at creation time. */
  setStatus(id: string, status: ProjectStatus): Promise<Project> {
    return this.update(id, { status });
  }

  /** Audit trail for a project, most-recent-first. Powers the timeline UI. */
  async listEvents(id: string): Promise<Event[]> {
    await this.findOne(id);
    return this.prisma.event.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** All WhatsApp messages tied to a project (and its originating WA number). */
  async listMessages(id: string): Promise<Message[]> {
    const project = await this.findOne(id);
    return this.prisma.message.findMany({
      where: {
        OR: [
          { projectId: id },
          project.originWaNumber ? { waNumber: project.originWaNumber } : { id: '__never__' },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static toDto(project: Project): ProjectDto {
    return {
      id: project.id,
      clientId: project.clientId,
      type: project.type,
      status: project.status,
      areaM2: project.areaM2,
      scope: project.scope,
      createdAt: project.createdAt.toISOString(),
    };
  }

  static eventToDto(e: Event): EventDto {
    return {
      id: e.id,
      type: e.type,
      projectId: e.projectId,
      userId: e.userId,
      payload: e.payload,
      createdAt: e.createdAt.toISOString(),
    };
  }

  static messageToDto(m: Message): MessageDto {
    return {
      id: m.id,
      clientId: m.clientId,
      projectId: m.projectId,
      direction: m.direction,
      waNumber: m.waNumber,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    };
  }
}
