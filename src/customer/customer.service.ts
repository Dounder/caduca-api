import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { CacheUtil, ExceptionHandler, hasRoles, ListResponse, PaginationDto } from 'src/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrentUser, RoleId } from 'src/user';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';
import { CUSTOMER_SELECT_LIST, CUSTOMER_SELECT_LIST_SUMMARY, CUSTOMER_SELECT_SINGLE } from './helper';
import { CustomerListResponse, CustomerResponse, CustomerSummary } from './interfaces';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, CustomerService.name);

  /**
   * Creates a new instance of the CustomerService.
   * @param prisma - The Prisma service instance for database operations
   * @param cacheManager - The cache manager instance for handling caching operations
   */
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Creates a new customer record in the database.
   *
   * @param createCustomerDto - The DTO containing customer creation data
   * @param user - The authenticated user performing the creation
   * @returns Promise<CustomerResponse> - The newly created customer data
   *
   * @throws {PrismaClientKnownRequestError} If there's a database constraint violation
   * @throws {PrismaClientValidationError} If the provided data is invalid
   *
   * @remarks
   * This method performs the following operations:
   * - Logs the creation attempt
   * - Creates a customer record with associated audit log
   * - Links the customer to the creating user
   * - Clears related cache
   */
  async create(createCustomerDto: CreateCustomerDto, user: CurrentUser): Promise<CustomerResponse> {
    const message = `Creating customer: ${JSON.stringify(createCustomerDto)}, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      const customer = await this.prisma.customer.create({
        data: {
          ...createCustomerDto,
          createdBy: { connect: { id: user.id } },
          logs: { create: { message, createdBy: { connect: { id: user.id } } } },
        },
        select: CUSTOMER_SELECT_SINGLE,
      });

      this.clearCache();

      return customer;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Retrieves a paginated list of customers with optional filtering and summary mode.
   *
   * @param user - The current authenticated user requesting the data
   * @param params - Pagination and filter parameters
   * @param params.page - The page number to retrieve
   * @param params.limit - Number of items per page
   * @param params.summary - If true, returns a summarized version of customer data
   * @param params.search - Optional search term to filter customers by name (case insensitive) or code (exact match)
   *
   * @returns Promise containing a paginated list response with either full customer data or summary
   *          The response includes metadata (total count, current page, last page) and the customer data array
   *
   * @remarks
   * - Admin users can see soft-deleted customers, while regular users cannot
   * - Search is performed case-insensitive on customer names
   * - If search term is numeric, it also tries to match exact customer codes
   * - Results are ordered by creation date in descending order
   *
   * @throws {Exception} Handled by ExceptionHandler if any error occurs during the operation
   */
  async findAll(
    user: CurrentUser,
    params: PaginationDto,
  ): Promise<ListResponse<CustomerListResponse | CustomerSummary>> {
    this.logger.log(`Fetching customers: ${JSON.stringify(params)}, user: ${user.username} (${user.id})`);
    try {
      const { page, limit, summary, search } = params;
      const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
      const where = {
        AND: [
          isAdmin ? {} : { deletedAt: null },
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' as const } },
                  { code: { equals: parseInt(search) || undefined } },
                ],
              }
            : {},
        ],
      };

      const [data, total] = await this.prisma.$transaction([
        this.prisma.customer.findMany({
          take: limit,
          skip: (page - 1) * limit,
          where,
          select: summary ? CUSTOMER_SELECT_LIST_SUMMARY : CUSTOMER_SELECT_LIST,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.customer.count({ where }),
      ]);

      return { meta: { total, page, lastPage: Math.ceil(total / limit) }, data };
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Retrieves a single customer by their ID with role-based access control
   *
   * @param id - The unique identifier of the customer to find
   * @param user - The current user making the request containing roles and permissions
   * @returns Promise<CustomerResponse> - The customer data if found
   *
   * @remarks
   * - Admin users can see both active and deleted customers
   * - Non-admin users can only see active (non-deleted) customers
   * - Uses CUSTOMER_SELECT_SINGLE for field selection
   *
   * @throws {NotFoundException} When customer is not found
   * @throws Propagates any other errors through exception handler
   */
  async findOne(id: string, user: CurrentUser): Promise<CustomerResponse> {
    this.logger.log(`Fetching customer: ${id}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
      const where = isAdmin ? { id } : { id, deletedAt: null };

      const customer = await this.prisma.customer.findUnique({ where, select: CUSTOMER_SELECT_SINGLE });

      if (!customer)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Customer with id ${id} not found`,
        });

      return customer;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Finds a customer by their unique code number
   *
   * @param code - The unique identifier code for the customer
   * @param user - The currently authenticated user making the request
   * @returns Promise containing customer information if found
   * @throws NotFoundException if customer is not found
   *
   * @remarks
   * - If user has Admin role, it will return customers even if they are soft-deleted
   * - For non-admin users, only active (non-deleted) customers are returned
   * - Uses CUSTOMER_SELECT_SINGLE to determine which fields to return
   */
  async findByCode(code: number, user: CurrentUser): Promise<CustomerResponse> {
    this.logger.log(`Fetching customer: ${code}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
      const where = isAdmin ? { code } : { code, deletedAt: null };

      const customer = await this.prisma.customer.findUnique({ where, select: CUSTOMER_SELECT_SINGLE });

      if (!customer)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Customer with code ${code} not found`,
        });

      return customer;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Updates a customer's information in the database.
   *
   * @param id - The unique identifier of the customer to update
   * @param updateCustomerDto - The DTO containing the customer's updated information
   * @param user - The currently authenticated user performing the update
   *
   * @returns Promise resolving to CustomerResponse containing the updated customer information
   *
   * @remarks
   * - Verifies customer existence before update via findOne
   * - Logs the update operation
   * - Creates an audit log entry for the update
   * - Clears any related cache after successful update
   * - All operations are performed within a transaction
   *
   * @throws Will throw an error if:
   * - Customer is not found
   * - User doesn't have permission to update the customer
   * - Database constraints are violated
   */
  async update(id: string, updateCustomerDto: UpdateCustomerDto, user: CurrentUser): Promise<CustomerResponse> {
    const message = `Updating customer: ${JSON.stringify({ id, ...updateCustomerDto })}, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      await this.findOne(id, user);

      const updatedCustomer = await this.prisma.customer.update({
        where: { id },
        data: {
          ...updateCustomerDto,
          updatedBy: { connect: { id: user.id } },
          logs: { create: { message, createdBy: { connect: { id: user.id } } } },
        },
        select: CUSTOMER_SELECT_SINGLE,
      });

      await this.clearCache();

      return updatedCustomer;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Performs a soft delete of a customer record by setting the deletedAt timestamp.
   *
   * @param id - The unique identifier of the customer to be deleted
   * @param user - The current user performing the deletion operation
   * @returns A Promise containing the deleted customer information
   *
   * @throws {ConflictException} If the customer is already marked as deleted
   * @throws {NotFoundException} If the customer is not found
   * @throws {ForbiddenException} If the user doesn't have permission to delete the customer
   *
   * @remarks
   * - This method performs a soft delete by updating the deletedAt field
   * - Creates a log entry for the deletion
   * - Clears the cache after successful deletion
   * - Associates the deleting user with the customer record
   */
  async remove(id: string, user: CurrentUser): Promise<CustomerResponse> {
    const message = `Deleting customer: ${id}, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      const customer = await this.findOne(id, user);

      if (customer.deletedAt !== null)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Customer with id ${id} cannot be deleted because it is already deleted`,
        });

      const deletedCustomer = await this.prisma.customer.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: { connect: { id: user.id } },
          logs: { create: { message, createdBy: { connect: { id: user.id } } } },
        },
        select: CUSTOMER_SELECT_SINGLE,
      });

      await this.clearCache();

      return deletedCustomer;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Restores a previously deleted customer by setting its deletedAt field to null.
   *
   * @param id - The unique identifier of the customer to restore
   * @param user - The current user performing the restoration
   *
   * @returns A Promise that resolves to the restored CustomerResponse
   *
   * @throws {ConflictException} When attempting to restore a customer that is not deleted
   * @throws {NotFoundException} When the customer is not found
   * @throws {ForbiddenException} When the user doesn't have permission to access the customer
   *
   * @remarks
   * This method will:
   * - Verify if the customer exists and is deleted
   * - Update the customer by removing deletion data
   * - Create a log entry for the restoration
   * - Clear the cache after successful restoration
   *
   * The operation is atomic and will either complete fully or fail entirely.
   */
  async restore(id: string, user: CurrentUser): Promise<CustomerResponse> {
    const message = `Restoring customer: ${id}, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      const customer = await this.findOne(id, user);

      if (customer.deletedAt === null)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Customer with id ${id} cannot be restored because it is not deleted`,
        });

      const restoredCustomer = await this.prisma.customer.update({
        where: { id },
        data: {
          deletedAt: null,
          deletedBy: { disconnect: true },
          logs: { create: { message, createdBy: { connect: { id: user.id } } } },
        },
        select: CUSTOMER_SELECT_SINGLE,
      });

      await this.clearCache();

      return restoredCustomer;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Clears all customer-related cache entries from the cache store
   *
   * @remarks
   * This method performs the following operations:
   * 1. Retrieves all keys that match the pattern 'customer:*'
   * 2. If keys are found, performs a multi-delete operation to remove them
   *
   * @throws {CacheException} If there's an error accessing the cache store
   * @returns Promise that resolves when the cache clearing operation is complete
   */
  async clearCache(): Promise<void> {
    await CacheUtil.clearCache(this.cacheManager, 'customer:*');
  }
}
