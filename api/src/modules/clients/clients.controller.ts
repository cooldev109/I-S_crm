import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ClientDto } from '@studio/shared';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  async list(): Promise<ClientDto[]> {
    const all = await this.clients.list();
    return all.map(ClientsService.toDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ClientDto> {
    return ClientsService.toDto(await this.clients.findOne(id));
  }

  @Post()
  async create(@Body() dto: CreateClientDto): Promise<ClientDto> {
    return ClientsService.toDto(await this.clients.create(dto));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateClientDto): Promise<ClientDto> {
    return ClientsService.toDto(await this.clients.update(id, dto));
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ClientDto> {
    return ClientsService.toDto(await this.clients.remove(id));
  }
}
