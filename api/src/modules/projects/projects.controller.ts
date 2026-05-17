import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EventDto, MessageDto, ProjectDto } from '@studio/shared';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  async list(@Query('clientId') clientId?: string): Promise<ProjectDto[]> {
    const all = await this.projects.list({ clientId });
    return all.map(ProjectsService.toDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProjectDto> {
    return ProjectsService.toDto(await this.projects.findOne(id));
  }

  @Post()
  async create(@Body() dto: CreateProjectDto): Promise<ProjectDto> {
    return ProjectsService.toDto(await this.projects.create(dto));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto): Promise<ProjectDto> {
    return ProjectsService.toDto(await this.projects.update(id, dto));
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ProjectDto> {
    return ProjectsService.toDto(await this.projects.remove(id));
  }

  @Get(':id/events')
  async events(@Param('id') id: string): Promise<EventDto[]> {
    const events = await this.projects.listEvents(id);
    return events.map(ProjectsService.eventToDto);
  }

  @Get(':id/messages')
  async messages(@Param('id') id: string): Promise<MessageDto[]> {
    const messages = await this.projects.listMessages(id);
    return messages.map(ProjectsService.messageToDto);
  }
}
