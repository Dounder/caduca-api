import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { Auth, GetUser } from 'src/auth';
import { CacheUtil, PaginationDto, ParseCuidPipe } from 'src/common';
import { User, RoleId } from 'src/user';
import { CreateProductDto, UpdateProductDto } from './dto';
import { ProductService } from './product.service';

@Auth()
@Controller('product')
export class ProductController {
  /**
   * Constructor for ProductController
   * @param productService - Service responsible for handling product-related operations
   * @param cacheManager - Cache manager instance for handling cache operations
   * @remarks The cache manager is injected using the CACHE_MANAGER token from the cache module
   * and implements the Cache interface for managing cached data
   */
  constructor(
    private readonly productService: ProductService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Creates a new product in the system.
   *
   * @param createProductDto - The Data Transfer Object containing the product information to be created
   * @param user - The authenticated user creating the product
   * @returns A promise that resolves to the newly created product
   *
   * @remarks
   * This endpoint requires authentication. The product will be associated with the user who creates it.
   *
   * @throws {UnauthorizedException}
   * When the user is not authenticated
   *
   * @throws {BadRequestException}
   * When the provided product data is invalid
   */
  @Post()
  @Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer)
  create(@Body() createProductDto: CreateProductDto, @GetUser() user: User) {
    return this.productService.create(createProductDto, user);
  }

  /**
   * Retrieves a paginated list of products with optional caching.
   *
   * @param user - The current authenticated user making the request
   * @param params - Pagination parameters including page, limit, summary and search options
   * @returns Promise containing the paginated product list
   *
   * @remarks
   * This endpoint implements caching using a composite key based on the pagination parameters.
   * The cache key format is: `product:page:{page}:limit:{limit}:summary:{summary}:search:{search}`
   *
   * If cached data exists for the given parameters, it will be returned.
   * Otherwise, the product service will be called and the result will be cached.
   */
  @Get()
  findAll(@GetUser() user: User, @Query() params: PaginationDto) {
    const cacheKey = `product:page:${params.page}:limit:${params.limit}:summary:${params.summary}:search:${params.search}`;
    return CacheUtil.getCachedResponse({
      cacheKey,
      cacheManager: this.cacheManager,
      callback: () => this.productService.findAll(user, params),
    });
  }

  /**
   * Clears the product cache from the system.
   * This method triggers a complete cache invalidation through the product service.
   *
   * @remarks
   * This operation is irreversible and might impact system performance temporarily
   * while the cache rebuilds.
   *
   * @returns {Promise<string>} A confirmation message indicating the cache was cleared
   * @throws {Error} If there's an issue accessing or clearing the cache
   */
  @Get('clear_cache')
  async clearCache() {
    await this.productService.clearCache();
    return 'Cache cleared';
  }

  /**
   * Retrieves a specific product by its ID with caching support.
   *
   * @param id - The CUID identifier of the product to retrieve
   * @param user - The currently authenticated user
   * @returns A Promise that resolves to the found product data
   *
   * @remarks
   * This endpoint implements caching using a Redis cache manager.
   * The cache key is formatted as `product:{id}`.
   * If the data is not in cache, it will fetch from the database and cache the result.
   *
   * @throws {NotFoundException} When the product is not found
   * @throws {ForbiddenException} When the user doesn't have permission to access the product
   */
  @Get(':id')
  findOne(@Param('id', ParseCuidPipe) id: string, @GetUser() user: User) {
    return CacheUtil.getCachedResponse({
      cacheKey: `product:${id}`,
      cacheManager: this.cacheManager,
      callback: () => this.productService.findOne({ id, user }),
    });
  }

  /**
   * Retrieves a product by its slug identifier with caching support.
   *
   * @param {string} slug - The unique slug identifier of the product
   * @param {User} user - The current authenticated user
   * @returns {Promise<Product>} A promise that resolves to the found product
   *
   * @remarks
   * This endpoint implements caching using a Redis cache manager.
   * The cache key is constructed using the pattern: `product:slug:{slug}`.
   * If the product is not found in cache, it will be fetched from the database
   * and then cached for subsequent requests.
   *
   * @throws {NotFoundException} If the product is not found
   */
  @Get('slug/:slug')
  findOneBySlug(@Param('slug') slug: string, @GetUser() user: User) {
    return CacheUtil.getCachedResponse({
      cacheKey: `product:slug:${slug}`,
      cacheManager: this.cacheManager,
      callback: () => this.productService.findOne({ id: slug, user, slug: true }),
    });
  }

  /**
   * Updates a product by its ID with the provided data.
   *
   * @param id - The CUID identifier of the product to update
   * @param updateProductDto - The DTO containing the product fields to update
   * @param user - The authenticated user performing the update operation
   * @returns A Promise that resolves to the updated product
   *
   * @remarks
   * This endpoint requires authentication and validates the CUID format through ParseCuidPipe.
   * The user parameter is extracted from the request context using the @GetUser() decorator.
   *
   * @throws {NotFoundException} When the product with the given ID is not found
   * @throws {UnauthorizedException} When the user doesn't have permission to update the product
   * @throws {BadRequestException} When the updateProductDto contains invalid data
   */
  @Patch(':id')
  @Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer)
  update(@Param('id', ParseCuidPipe) id: string, @Body() updateProductDto: UpdateProductDto, @GetUser() user: User) {
    return this.productService.update(id, updateProductDto, user);
  }

  /**
   * Deletes a product from the database
   * @param id - The CUID identifier of the product to remove
   * @param user - The authenticated user attempting the deletion
   * @returns A promise that resolves to the deleted product data
   * @throws {NotFoundException} When the product with the given id is not found
   * @throws {ForbiddenException} When the user doesn't have permission to delete the product
   */
  @Delete(':id')
  @Auth(RoleId.Admin, RoleId.Developer)
  remove(@Param('id', ParseCuidPipe) id: string, @GetUser() user: User) {
    return this.productService.remove(id, user);
  }

  /**
   * Restores a previously soft-deleted product.
   *
   * @param id - The CUID identifier of the product to restore
   * @param user - The currently authenticated user making the request
   * @returns A promise that resolves to the restored product
   *
   * @remarks
   * This endpoint will fail if:
   * - The product with the given ID doesn't exist
   * - The product is not currently in a deleted state
   * - The user doesn't have permission to restore products
   *
   * @throws {NotFoundException} When the product cannot be found
   * @throws {ForbiddenException} When the user lacks restore permissions
   */
  @Patch(':id/restore')
  @Auth(RoleId.Admin, RoleId.Developer)
  restore(@Param('id', ParseCuidPipe) id: string, @GetUser() user: User) {
    return this.productService.restore(id, user);
  }
}
