import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, Inject } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './dto';
import { Auth, GetUser } from 'src/auth';
import { CurrentUser, RoleId } from 'src/user';
import { PaginationDto, ParseCuidPipe } from 'src/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Controller('product')
@Auth()
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Post()
  @Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer)
  create(@Body() createProductDto: CreateProductDto, @GetUser() user: CurrentUser) {
    return this.productService.create(createProductDto, user);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto, @GetUser() user: CurrentUser) {
    const cacheKey = `product:page:${pagination.page}:limit:${pagination.limit}`;
    return this.getCachedResponse(cacheKey, () => this.productService.findAll(pagination, user));
  }

  @Get('clear_cache')
  async clearCache() {
    await this.productService.clearCache();
    return 'Cache cleared';
  }

  @Get(':id')
  findOne(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.getCachedResponse(`product:${id}`, () => this.productService.findOne(id, user));
  }

  @Patch(':id')
  @Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer)
  update(
    @Param('id', ParseCuidPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUser() user: CurrentUser,
  ) {
    return this.productService.update(id, updateProductDto, user);
  }

  @Delete(':id')
  @Auth(RoleId.Admin, RoleId.Developer)
  remove(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.productService.remove(id, user);
  }

  @Patch(':id/restore')
  @Auth(RoleId.Admin, RoleId.Developer)
  restore(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.productService.restore(id, user);
  }

  private async getCachedResponse<T>(cacheKey: string, callback: () => Promise<T>): Promise<T> {
    const cachedResponse = await this.cacheManager.get<T>(cacheKey);

    if (cachedResponse) return cachedResponse;

    const response = await callback();
    await this.cacheManager.set(cacheKey, response);

    return response;
  }
}
