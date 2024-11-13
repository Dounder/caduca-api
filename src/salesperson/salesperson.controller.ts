import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Auth, GetUser } from 'src/auth';
import { PaginationDto, ParseCuidPipe } from 'src/common';
import { CurrentUser } from 'src/user';
import { CreateSalespersonDto, UpdateSalespersonDto } from './dto';
import { SalespersonService } from './salesperson.service';

@Controller('salesperson')
@Auth()
export class SalespersonController {
  constructor(
    private readonly salespersonService: SalespersonService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Post()
  create(@Body() createSalespersonDto: CreateSalespersonDto, @GetUser() user: CurrentUser) {
    return this.salespersonService.create(createSalespersonDto, user);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto, @GetUser() user: CurrentUser) {
    const key = `salesperson:page:${pagination.page}:limit:${pagination.limit}`;

    return this.getCachedResponse(key, () => this.salespersonService.findAll(pagination, user));
  }

  @Get(':id')
  findOne(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.getCachedResponse(`salesperson:id:${id}`, () => this.salespersonService.findOne(id, user));
  }

  @Get('code/:code')
  findOneByCode(@Param('code', ParseIntPipe) code: number, @GetUser() user: CurrentUser) {
    return this.getCachedResponse(`salesperson:code:${code}`, () => this.salespersonService.findOneByCode(code, user));
  }

  @Patch(':id')
  update(
    @Param('id', ParseCuidPipe) id: string,
    @Body() updateSalespersonDto: UpdateSalespersonDto,
    @GetUser() user: CurrentUser,
  ) {
    return this.salespersonService.update(id, updateSalespersonDto, user);
  }

  @Delete(':id')
  remove(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.salespersonService.remove(id, user);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.salespersonService.restore(id, user);
  }

  private async getCachedResponse<T>(key: string, callback: () => Promise<T>): Promise<T> {
    const cachedResponse = await this.cacheManager.get<T>(key);

    if (cachedResponse) return cachedResponse;

    const res = await callback();
    await this.cacheManager.set(key, res);

    return res;
  }
}
