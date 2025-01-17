import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { Auth, GetUser } from 'src/auth';
import { PaginationDto, ParseCuidPipe } from 'src/common';
import { CurrentUser, RoleId } from 'src/user';
import { CreateProductDto, UpdateProductDto } from './dto';
import { ProductService } from './product.service';

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
  findAll(@GetUser() user: CurrentUser, @Query() params: PaginationDto) {
    const cacheKey = `product:page:${params.page}:limit:${params.limit}:summary:${params.summary}`;
    return this.getCachedResponse(cacheKey, () => this.productService.findAll(user, params));
  }

  @Get('clear_cache')
  async clearCache() {
    await this.productService.clearCache();
    return 'Cache cleared';
  }

  @Get(':id')
  findOne(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.getCachedResponse(`product:${id}`, () => this.productService.findOne({ id, user }));
  }

  @Get('slug/:slug')
  findOneBySlug(@Param('slug') slug: string, @GetUser() user: CurrentUser) {
    return this.getCachedResponse(`product:slug:${slug}`, () =>
      this.productService.findOne({ id: slug, user, slug: true }),
    );
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
