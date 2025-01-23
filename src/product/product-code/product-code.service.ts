import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CacheUtil, ExceptionHandler, FindAllParams, hasRoles, ListResponse } from 'src/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrentUser, RoleId } from 'src/user';
import { CreateProductCodeDto } from './dto';
import { PRODUCT_CODE_SELECT_LIST, PRODUCT_CODE_SELECT_LIST_SUMMARY, PRODUCT_CODE_SELECT_SINGLE } from './helpers';
import { Code, CodeList, CodeSummary } from './interfaces';

@Injectable()
export class ProductCodeService {
  private readonly logger = new Logger(ProductCodeService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, ProductCodeService.name);

  /**
   * Creates a new instance of the service
   * @param prisma - The Prisma service instance for database operations
   * @param cacheManager - Cache manager instance for handling caching operations
   *
   * @remarks
   * The constructor uses dependency injection to receive both the PrismaService
   * and Cache manager instances. The Cache manager is injected using the
   * CACHE_MANAGER token.
   */
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Creates a new product code in the system.
   *
   * @param createProductCodeDto - The data transfer object containing the product code creation details
   * @param user - The current user performing the creation operation
   * @returns A Promise that resolves to the newly created Code entity
   *
   * @throws {PrismaClientKnownRequestError} When there's a known database constraint violation
   * @throws {PrismaClientUnknownRequestError} When an unknown database error occurs
   *
   * @remarks
   * This method:
   * - Creates a new product code with associations to both the creator and the product
   * - Clears the cache after successful creation
   * - Logs the creation attempt with user details
   * - Handles errors through the exception handler service
   */
  async create(createProductCodeDto: CreateProductCodeDto, user: CurrentUser): Promise<Code> {
    this.logger.log(
      `Creating product code: ${JSON.stringify(createProductCodeDto)}, user: ${user.username} (${user.id})`,
    );
    try {
      const newCode = await this.prisma.productCode.create({
        data: { createdBy: { connect: { id: user.id } }, product: { connect: { id: createProductCodeDto.productId } } },
        select: PRODUCT_CODE_SELECT_SINGLE,
      });

      await this.clearCache();

      return newCode;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Retrieves a paginated list of product codes based on user permissions and pagination parameters
   *
   * @param params - The parameters for finding product codes
   * @param params.pagination - Pagination configuration object
   * @param params.pagination.page - The page number to retrieve
   * @param params.pagination.limit - Number of items per page
   * @param params.pagination.summary - If true, returns a summarized version of the product codes
   * @param params.user - The user making the request
   * @param params.user.roles - User roles for permission checking
   * @param params.user.id - User identifier
   * @param params.user.username - User's username
   *
   * @returns A promise that resolves to a ListResponse containing either CodeList or CodeSummary items
   *
   * @remarks
   * - Admin users can see all product codes including deleted ones
   * - Non-admin users can only see non-deleted product codes
   * - Results are ordered by creation date in descending order
   *
   * @throws {PrismaClientKnownRequestError} If there's an error accessing the database
   */
  async findAll({ pagination, user }: FindAllParams): Promise<ListResponse<CodeList | CodeSummary>> {
    this.logger.log(`Fetching code products: ${JSON.stringify(pagination)}, user: ${user.username} (${user.id})`);
    const { page, limit, summary } = pagination;
    const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
    const where = isAdmin ? {} : { deletedAt: null };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.productCode.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where,
        select: summary ? PRODUCT_CODE_SELECT_LIST_SUMMARY : PRODUCT_CODE_SELECT_LIST,
        orderBy: { createdAt: Prisma.SortOrder.desc },
      }),
      this.prisma.product.count({ where }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return { meta: { total, page, lastPage }, data };
  }

  /**
   * Retrieves a product code by its numeric code value.
   *
   * @param code - The numeric code to search for
   * @param user - The current user making the request
   *
   * @returns Promise that resolves to the found Code entity
   *
   * @throws {NotFoundException} When no product code is found with the given code
   *
   * @remarks
   * - If the user has Admin role, it will also return soft-deleted codes
   * - For non-admin users, only active (non-deleted) codes are returned
   * - The returned code contains only the fields specified in PRODUCT_CODE_SELECT_SINGLE
   */
  async findByCode(code: number, user: CurrentUser): Promise<Code> {
    this.logger.log(`Fetching product by code: ${code}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
      const where = isAdmin ? { code } : { code, deletedAt: null };

      const productCode = await this.prisma.productCode.findFirst({ where, select: PRODUCT_CODE_SELECT_SINGLE });

      if (!productCode)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Product code with code ${code} not found`,
        });

      return productCode;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Retrieves a single product code by its ID, with role-based access control
   * @param id - The unique identifier of the product code to find
   * @param user - The current user making the request
   * @returns Promise<Code> - The found product code
   * @throws NotFoundException - When the product code is not found
   * @remarks
   * - Admin users can see both active and deleted product codes
   * - Non-admin users can only see active (non-deleted) product codes
   * - The method includes logging for audit purposes
   */
  async findOne(id: string, user: CurrentUser): Promise<Code> {
    this.logger.log(`Fetching product by id: ${id}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
      const where = isAdmin ? { id } : { id, deletedAt: null };

      const productCode = await this.prisma.productCode.findFirst({ where, select: PRODUCT_CODE_SELECT_SINGLE });

      if (!productCode)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Product code with id ${id} not found`,
        });

      return productCode;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Performs a soft delete of a product code by setting its deletedAt timestamp and updating related fields.
   *
   * @param id - The unique identifier of the product code to be deleted
   * @param user - The current user performing the delete operation
   * @returns Promise<Code> - The deleted product code object
   *
   * @throws {ConflictException} When the product code cannot be deleted (deletedAt remains null)
   * @throws {NotFoundException} When the product code is not found (via findOne)
   * @throws {ForbiddenException} When the user doesn't have permission to delete the code (via findOne)
   *
   * @remarks
   * - This performs a soft delete by updating the deletedAt timestamp
   * - The operation also updates the deletedBy and updatedBy references
   * - The cache is cleared after a successful deletion
   * - The method validates the existence and permissions via findOne before deletion
   */
  async remove(id: string, user: CurrentUser): Promise<Code> {
    this.logger.log(`Deleting product code: ${id}, user: ${user.username} (${user.id})`);
    try {
      await this.findOne(id, user);

      const deletedCode = await this.prisma.productCode.update({
        where: { id },
        select: PRODUCT_CODE_SELECT_SINGLE,
        data: {
          deletedAt: new Date(),
          deletedBy: { connect: { id: user.id } },
          updatedBy: { connect: { id: user.id } },
        },
      });

      if (deletedCode.deletedAt === null)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Product code with id ${id} cannot be deleted`,
        });

      await this.clearCache();

      return deletedCode;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Restores a previously deleted product code.
   *
   * @param id - The unique identifier of the product code to restore
   * @param user - The current user performing the restore operation
   *
   * @returns Promise<Code> - The restored product code
   *
   * @throws {NotFoundException} When product code is not found
   * @throws {ForbiddenException} When user doesn't have permission
   * @throws {ConflictException} When product code cannot be restored
   *
   * @remarks
   * This method will:
   * - Verify the existence of the product code
   * - Update the deletedAt field to null
   * - Disconnect the deletedBy relation
   * - Connect the updatedBy relation to current user
   * - Clear the cache after successful restoration
   */
  async restore(id: string, user: CurrentUser): Promise<Code> {
    this.logger.log(`Restoring product code: ${id}, user: ${user.username} (${user.id})`);

    try {
      await this.findOne(id, user);

      const restoredCode = await this.prisma.productCode.update({
        where: { id },
        select: PRODUCT_CODE_SELECT_SINGLE,
        data: { deletedAt: null, deletedBy: { disconnect: true }, updatedBy: { connect: { id: user.id } } },
      });

      if (restoredCode.deletedAt === null)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Product code with id ${id} cannot be restored`,
        });

      await this.clearCache();

      return restoredCode;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Cleans up the cached data for product codes and products.
   *
   * This method clears all cached entries that match the following patterns:
   * - 'product_codes:*'
   * - 'product:*'
   *
   * @remarks
   * This operation is asynchronous and will remove all matching cache entries.
   * Use this method when you need to invalidate the cache after major data changes.
   *
   * @returns {Promise<void>} A promise that resolves when the cache has been cleared
   * @throws {Error} If there's an issue accessing or clearing the cache
   */
  async clearCache() {
    await CacheUtil.clearCache(this.cacheManager, 'product_codes:*');
    await CacheUtil.clearCache(this.cacheManager, 'product:*');
  }
}
