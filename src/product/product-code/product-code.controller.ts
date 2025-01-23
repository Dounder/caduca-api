import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Auth, GetUser } from 'src/auth';
import { CacheUtil, ListResponse, PaginationDto, ParseCuidPipe } from 'src/common';
import { User, RoleId } from 'src/user';
import { CreateProductCodeDto } from './dto';
import { Code, CodeSummary } from './interfaces';
import { ProductCodeService } from './product-code.service';

@Auth()
@Controller('product/code')
export class ProductCodeController {
  /**
   * Creates an instance of ProductCodeController.
   *
   * @constructor
   * @param {ProductCodeService} productCodeService - Service responsible for handling product code operations
   * @param {Cache} cacheManager - Cache manager instance for handling caching operations
   *
   * @remarks
   * The cache manager is injected using the `@Inject(CACHE_MANAGER)` decorator from NestJS.
   * This controller uses dependency injection to receive both the ProductCodeService and Cache dependencies.
   */
  constructor(
    private readonly productCodeService: ProductCodeService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Creates a new product code.
   * @param createProductCodeDto - The data transfer object containing the product code information
   * @param user - The current authenticated user
   * @returns A Promise that resolves to the created Code entity
   * @throws {UnauthorizedException} If the user is not authenticated
   * @throws {BadRequestException} If the provided DTO is invalid
   */
  @Post()
  @Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer)
  create(@Body() createProductCodeDto: CreateProductCodeDto, @GetUser() user: User): Promise<Code> {
    return this.productCodeService.create(createProductCodeDto, user);
  }

  /**
   * Retrieves a paginated list of product codes.
   *
   * @param pagination - Pagination parameters including page number, limit and summary flag
   * @param user - Current authenticated user
   * @returns Promise containing a paginated list response of either full Code objects or CodeSummary objects
   *
   * @remarks
   * This endpoint implements caching using a composite key based on pagination parameters.
   * The cache key format is: `product_codes:page:{page}:limit:{limit}`
   *
   * If pagination.summary is true, returns CodeSummary objects instead of full Code objects
   * for better performance and reduced payload size.
   */
  @Get('all')
  findAll(@Query() pagination: PaginationDto, @GetUser() user: User): Promise<ListResponse<Code | CodeSummary>> {
    const cacheKey = `product_codes:page:${pagination.page}:limit:${pagination.limit}`;
    return CacheUtil.getCachedResponse({
      cacheKey,
      cacheManager: this.cacheManager,
      callback: () => this.productCodeService.findAll({ pagination, user, summary: pagination.summary }),
    });
  }

  /**
   * Clears the cached product codes from the service.
   *
   * @remarks
   * This method triggers a complete cache invalidation in the ProductCodeService.
   * Use with caution as it may impact performance until the cache is rebuilt.
   *
   * @returns A Promise that resolves to a confirmation string when the cache has been cleared
   * @throws {Error} If the cache clearing operation fails
   */
  @Get('clear_cache')
  async clearCache(): Promise<string> {
    await this.productCodeService.clearCache();
    return 'Cache cleared';
  }

  /**
   * Retrieves a product code by its numeric identifier.
   * This endpoint implements caching to improve performance.
   *
   * @param code - The numeric code to search for
   * @param user - The current authenticated user
   * @returns A Promise that resolves to a Code entity
   *
   * @throws {NotFoundException} When the code is not found
   * @throws {ForbiddenException} When the user doesn't have permission to access the code
   *
   * @remarks
   * The response is cached using the key pattern `product_code:{code}`.
   * Cache invalidation should be handled when the code is updated or deleted.
   */
  @Get(':code')
  findOne(@Param('code', ParseIntPipe) code: number, @GetUser() user: User): Promise<Code> {
    return CacheUtil.getCachedResponse({
      cacheKey: `product_code:${code}`,
      cacheManager: this.cacheManager,
      callback: () => this.productCodeService.findByCode(code, user),
    });
  }

  /**
   * Removes a product code from the system
   * @param id - The CUID identifier of the product code to remove
   * @param user - The current authenticated user requesting the removal
   * @returns Promise resolving to the removed Code entity
   * @throws NotFoundException - If the product code with the given id does not exist
   * @throws ForbiddenException - If the user does not have permission to remove the code
   */
  @Delete(':id')
  @Auth(RoleId.Admin, RoleId.Developer)
  remove(@Param('id', ParseCuidPipe) id: string, @GetUser() user: User): Promise<Code> {
    return this.productCodeService.remove(id, user);
  }

  /**
   * Restores a previously soft-deleted product code.
   *
   * @param id - The CUID identifier of the product code to restore
   * @param user - The current authenticated user performing the restore operation
   * @returns A Promise that resolves to the restored Code entity
   *
   * @remarks
   * - The id parameter is validated using ParseCuidPipe to ensure it's a valid CUID
   * - Only users with appropriate permissions can restore product codes
   * - If the code doesn't exist or was not previously soft-deleted, this operation will fail
   *
   * @throws {NotFoundException} When the product code is not found
   * @throws {UnauthorizedException} When the user lacks restore permissions
   */
  @Patch(':id/restore')
  @Auth(RoleId.Admin, RoleId.Developer)
  restore(@Param('id', ParseCuidPipe) id: string, @GetUser() user: User): Promise<Code> {
    return this.productCodeService.restore(id, user);
  }
}
