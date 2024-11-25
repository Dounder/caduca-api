import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Auth, GetUser } from 'src/auth';
import { ParseCuidPipe } from 'src/common';
import { CurrentUser, RoleId } from 'src/user';
import { CreateProductCodeDto } from './dto';
import { ProductCodeService } from './product-code.service';

@Controller('product/code')
export class ProductCodeController {
  constructor(
    private readonly productCodeService: ProductCodeService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Post()
  @Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer)
  create(@Body() createProductCodeDto: CreateProductCodeDto, @GetUser() user: CurrentUser) {
    return this.productCodeService.create(createProductCodeDto, user);
  }

  @Get('clear_cache')
  async clearCache() {
    await this.productCodeService.clearCache();
    return 'Cache cleared';
  }

  @Get(':code')
  findOne(@Param('code', ParseIntPipe) code: number, @GetUser() user: CurrentUser) {
    return this.getCachedResponse(`product_code:${code}`, () => this.productCodeService.findByCode(code, user));
  }

  @Delete(':id')
  @Auth(RoleId.Admin, RoleId.Developer)
  remove(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.productCodeService.remove(id, user);
  }

  @Patch(':id/restore')
  @Auth(RoleId.Admin, RoleId.Developer)
  restore(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.productCodeService.restore(id, user);
  }

  private async getCachedResponse<T>(cacheKey: string, callback: () => Promise<T>): Promise<T> {
    const cachedResponse = await this.cacheManager.get<T>(cacheKey);

    if (cachedResponse) return cachedResponse;

    const response = await callback();
    await this.cacheManager.set(cacheKey, response);

    return response;
  }
}
