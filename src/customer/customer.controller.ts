import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';

import { Auth, GetUser } from 'src/auth';
import { PaginationDto, ParseCuidPipe } from 'src/common';
import { CurrentUser } from 'src/user';
import { CustomerService } from './customer.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';

@Controller('customer')
@Auth()
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto, @GetUser() user: CurrentUser) {
    return this.customerService.create(createCustomerDto, user);
  }

  @Get()
  findAll(@GetUser() user: CurrentUser, @Query() params: PaginationDto) {
    const { page, limit, summary, search } = params;
    const cacheKey = `customer:all:${page}:${limit}:${summary}:${search}`;

    return this.getCachedResponse(cacheKey, () => this.customerService.findAll(user, params));
  }

  @Get('clear_cache')
  async clearCache() {
    await this.customerService.clearCache();
    return 'Cache cleared';
  }

  @Get(':id')
  findOne(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.getCachedResponse(`customer:id:${id}`, () => this.customerService.findOne(id, user));
  }

  @Get('code/:code')
  findByCode(@Param('code', ParseIntPipe) code: number, @GetUser() user: CurrentUser) {
    return this.getCachedResponse(`customer:code:${code}`, () => this.customerService.findByCode(code, user));
  }

  @Patch(':id')
  update(
    @Param('id', ParseCuidPipe) id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @GetUser() user: CurrentUser,
  ) {
    return this.customerService.update(id, updateCustomerDto, user);
  }

  @Delete(':id')
  remove(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.customerService.remove(id, user);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.customerService.restore(id, user);
  }

  private async getCachedResponse<T>(cacheKey: string, callback: () => Promise<T>): Promise<T> {
    const cachedResponse = await this.cacheManager.get<T>(cacheKey);

    if (cachedResponse) return cachedResponse;

    const response = await callback();
    await this.cacheManager.set(cacheKey, response);

    return response;
  }
}
