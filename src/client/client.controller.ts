import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';

import { Auth, GetUser } from 'src/auth';
import { PaginationDto, ParseCuidPipe } from 'src/common';
import { CurrentUser } from 'src/user';
import { ClientService } from './client.service';
import { CreateClientDto, UpdateClientDto } from './dto';

@Controller('client')
@Auth()
export class ClientController {
  constructor(
    private readonly clientService: ClientService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto, @GetUser() user: CurrentUser) {
    return this.clientService.create(createClientDto, user);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto, @GetUser() user: CurrentUser) {
    return this.getCachedResponse(`clients:${JSON.stringify(pagination)}`, () =>
      this.clientService.findAll(pagination, user),
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.getCachedResponse(`client:id:${id}`, () => this.clientService.findOne(id, user));
  }

  @Get('code/:code')
  findByCode(@Param('code', ParseIntPipe) code: number, @GetUser() user: CurrentUser) {
    return this.getCachedResponse(`client:code:${code}`, () => this.clientService.findByCode(code, user));
  }

  @Patch(':id')
  update(
    @Param('id', ParseCuidPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
    @GetUser() user: CurrentUser,
  ) {
    return this.clientService.update(id, updateClientDto, user);
  }

  @Delete(':id')
  remove(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.clientService.remove(id, user);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.clientService.restore(id, user);
  }

  private async getCachedResponse<T>(cacheKey: string, callback: () => Promise<T>): Promise<T> {
    const cachedResponse = await this.cacheManager.get<T>(cacheKey);

    if (cachedResponse) return cachedResponse;

    const response = await callback();
    await this.cacheManager.set(cacheKey, response);

    return response;
  }
}
