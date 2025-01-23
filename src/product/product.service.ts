import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CacheUtil, ExceptionHandler, hasRoles, ListResponse, PaginationDto } from 'src/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrentUser, RoleId } from 'src/user';
import { CreateProductDto, UpdateProductDto } from './dto';
import { PRODUCT_SELECT_LIST, PRODUCT_SELECT_LIST_SUMMARY, PRODUCT_SELECT_SINGLE } from './helpers';
import { ProductListResponse, ProductResponse, ProductSummary } from './interfaces';

interface FindOneProps {
  id: string;
  user: CurrentUser;
  slug?: boolean;
}

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, ProductService.name);

  /**
   * Creates an instance of the ProductService.
   *
   * @constructor
   * @param prisma - The Prisma service instance for database operations
   * @param cacheManager - The Cache manager instance for caching operations
   *
   * @remarks
   * This constructor uses dependency injection to receive both the PrismaService
   * and Cache manager. The Cache manager is injected using the CACHE_MANAGER token.
   */
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Creates a new product in the database
   *
   * @param createProductDto - The DTO containing the product data to create
   * @param user - The current user creating the product
   * @returns Promise containing the created product data
   *
   * @remarks
   * This method performs the following operations:
   * - Generates a slug based on the product name
   * - Creates the product record with the provided data
   * - Optionally creates a product code if newCode is true
   * - Clears the cache after successful creation
   *
   * The operation is wrapped in a transaction to ensure data consistency.
   * Any errors during creation are handled by the exception handler.
   *
   * @throws Will delegate error handling to ExceptionHandler service
   */
  async create(createProductDto: CreateProductDto, user: CurrentUser): Promise<ProductResponse> {
    this.logger.log(`Creating product: ${JSON.stringify(createProductDto)}, user: ${user.username} (${user.id})`);
    try {
      const { newCode, ...productData } = createProductDto;

      const product = await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            ...productData,
            slug: await this.generateSlug(productData.name),
            createdBy: { connect: { id: user.id } },
            updatedBy: { connect: { id: user.id } },
          },
          select: PRODUCT_SELECT_SINGLE,
        });

        if (newCode) {
          await tx.productCode.create({
            data: { product: { connect: { id: product.id } }, createdBy: { connect: { id: user.id } } },
          });
        }
        return product;
      });

      await this.clearCache();

      return product;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Retrieves a paginated list of products with optional summary view and search functionality.
   *
   * @param user - The current user requesting the products
   * @param params - Pagination parameters including:
   *                - page: Current page number
   *                - limit: Items per page
   *                - summary: Whether to return summarized product data
   *                - search: Optional search term for filtering products by name or code
   *
   * @returns A Promise containing:
   *          - meta: Pagination metadata (total items, current page, last page)
   *          - data: Array of products matching the query criteria
   *
   * @remarks
   * - Admin users can see deleted products, while regular users only see active products
   * - Search functionality supports both product names (case-insensitive) and product codes
   * - Results are ordered by creation date in descending order
   *
   * @throws {PrismaClientKnownRequestError} When database query fails
   */
  async findAll(user: CurrentUser, params: PaginationDto): Promise<ListResponse<ProductListResponse | ProductSummary>> {
    this.logger.log(`Fetching products: ${JSON.stringify(params)}, user: ${user.username} (${user.id})`);
    const { page, limit, summary, search } = params;
    const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
    const where = {
      AND: [
        isAdmin ? {} : { deletedAt: null },
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { codes: { some: { code: { equals: parseInt(search) || undefined } } } },
              ],
            }
          : {},
      ],
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where,
        select: summary ? PRODUCT_SELECT_LIST_SUMMARY : PRODUCT_SELECT_LIST,
        orderBy: { createdAt: Prisma.SortOrder.desc },
      }),
      this.prisma.product.count({ where }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return { meta: { total, page, lastPage }, data };
  }

  /**
   * Retrieves a single product by ID or slug.
   *
   * @param options - The search parameters
   * @param options.id - The product ID or slug value to search for
   * @param options.user - The user making the request
   * @param options.slug - Boolean flag indicating whether to search by slug instead of ID
   *
   * @returns Promise containing the found product data
   *
   * @throws {NotFoundException} When product is not found
   *
   * @remarks
   * - Admin users can see soft-deleted products
   * - Non-admin users can only see non-deleted products
   * - The response is filtered through PRODUCT_SELECT_SINGLE projection
   */
  async findOne({ id, user, slug }: FindOneProps): Promise<ProductResponse> {
    this.logger.log(`Fetching product by ${slug ? 'slug' : 'id'}: ${id}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
      const where = isAdmin ? { [slug ? 'slug' : 'id']: id } : { [slug ? 'slug' : 'id']: id, deletedAt: null };

      const product = await this.prisma.product.findFirst({ where, select: PRODUCT_SELECT_SINGLE });

      if (!product)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Product with ${slug ? 'slug' : 'id'} ${id} not found`,
        });

      return product;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Updates an existing product in the database
   *
   * @param id - The unique identifier of the product to update
   * @param updateProductDto - The DTO containing the updated product data
   * @param user - The current user performing the update operation
   *
   * @returns A Promise that resolves to the updated ProductResponse
   *
   * @remarks
   * - Only updates the product if the new name is different from the existing one
   * - Generates a new slug based on the updated name
   * - Updates are performed within a transaction to ensure data consistency
   * - Clears the cache after successful update
   *
   * @throws Will delegate error handling to the exception handler if update fails
   */
  async update(id: string, updateProductDto: UpdateProductDto, user: CurrentUser): Promise<ProductResponse> {
    this.logger.log(
      `Updating product: ${JSON.stringify({ id, ...updateProductDto })}, user: ${user.username} (${user.id})`,
    );
    try {
      const dbProduct = await this.findOne({ id, user });

      const { name } = updateProductDto;

      if (dbProduct.name === name) return dbProduct;

      const product = await this.prisma.$transaction(async (tx) => {
        const product = await this.prisma.product.update({
          where: { id },
          data: {
            name,
            slug: await this.generateSlug(updateProductDto.name),
            updatedBy: { connect: { id: user.id } },
          },
          select: PRODUCT_SELECT_SINGLE,
        });

        return product;
      });

      await this.clearCache();

      return product;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Performs a soft delete operation on a product.
   *
   * @param id - The unique identifier of the product to delete
   * @param user - The current authenticated user performing the deletion
   * @returns Promise resolving to ProductResponse containing the soft-deleted product
   *
   * @throws {ConflictException} When the product is already deleted (deletedAt is not null)
   * @throws {NotFoundException} When the product is not found (via findOne)
   * @throws {ForbiddenException} When the user doesn't have permission to delete the product
   *
   * @remarks
   * - This is a soft delete operation - the product is marked as deleted but remains in the database
   * - The operation updates the deletedAt timestamp and sets the deletedBy reference
   * - The cache is cleared after successful deletion
   * - The operation logs the deletion attempt with user information
   */
  async remove(id: string, user: CurrentUser): Promise<ProductResponse> {
    this.logger.log(`Deleting product: ${id}, user: ${user.username} (${user.id})`);
    try {
      const product = await this.findOne({ id, user });

      if (product.deletedAt !== null)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Product with id ${id} is already deleted`,
        });

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: { connect: { id: user.id } },
        },
        select: PRODUCT_SELECT_SINGLE,
      });

      await this.clearCache();

      return updatedProduct;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Restores a previously soft-deleted product.
   *
   * @param id - The unique identifier of the product to restore
   * @param user - The current user attempting the restore operation
   *
   * @throws {ConflictException} If the product is not deleted (deletedAt is null)
   * @throws {NotFoundException} If the product is not found
   * @throws {ForbiddenException} If the user doesn't have permission to access the product
   *
   * @returns {Promise<ProductResponse>} The restored product data
   *
   * @remarks
   * - This method performs a soft restore by setting deletedAt to null
   * - It also removes the association with the user who deleted it
   * - The cache is cleared after a successful restore
   * - The operation is logged with user information
   */
  async restore(id: string, user: CurrentUser): Promise<ProductResponse> {
    this.logger.log(`Restoring product: ${id}, user: ${user.username} (${user.id})`);
    try {
      const product = await this.findOne({ id, user });

      if (product.deletedAt === null)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Product with id ${id} is already restored`,
        });

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          deletedAt: null,
          deletedBy: { disconnect: true },
        },
        select: PRODUCT_SELECT_SINGLE,
      });

      await this.clearCache();

      return updatedProduct;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Generates a URL-friendly slug from the provided text.
   *
   * The slug is created by:
   * 1. Normalizing and removing diacritics
   * 2. Converting to lowercase
   * 3. Replacing non-alphanumeric characters with underscores
   * 4. Trimming leading/trailing underscores
   *
   * If the generated slug already exists in the database,
   * a random 5-character suffix is appended to ensure uniqueness.
   *
   * @param text - The text to convert into a slug
   * @returns A promise that resolves to a unique slug string
   *
   * @remarks
   * The generated slug is guaranteed to be unique within the products table
   * The random suffix uses base-36 encoding (0-9 and a-z)
   *
   * @example
   * ```ts
   * // Returns: "hello_world"
   * await generateSlug("Hello World!")
   *
   * // Returns: "hello_world_x7z9y" (if "hello_world" exists)
   * await generateSlug("Hello World!")
   * ```
   */
  private async generateSlug(text: string): Promise<string> {
    const slug = text
      .normalize('NFD') // Normalize accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with '_'
      .replace(/^_+|_+$/g, ''); // Trim starting and ending '_'

    const existing = await this.prisma.product.findFirst({ where: { slug } });
    if (!existing) return slug;

    // If the base slug exists, append a short unique suffix
    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    return `${slug}_${uniqueSuffix}`;
  }

  async clearCache() {
    await CacheUtil.clearCache(this.cacheManager, 'product:*');
  }
}
