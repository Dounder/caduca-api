import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';

import { Auth, GetUser } from 'src/auth';
import { CacheUtil, ListResponse, PaginationDto, ParseCuidPipe } from 'src/common';
import { User } from 'src/user';
import { CustomerService } from './customer.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';
import { CustomerListResponse, CustomerResponse, CustomerSummary } from './interfaces';

@Auth()
@Controller('customer')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Creates a new customer in the system
   * @param createCustomerDto - The data transfer object containing customer information
   * @param user - The currently authenticated user creating the customer
   * @returns Promise containing the customer response object
   * @throws {UnauthorizedException} If user is not authenticated
   * @throws {BadRequestException} If validation fails for customer data
   */
  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto, @GetUser() user: User): Promise<CustomerResponse> {
    return this.customerService.create(createCustomerDto, user);
  }

  /**
   * Retrieves a paginated list of customers with optional summary and search functionality
   *
   * @param user - The currently authenticated user
   * @param params - Pagination parameters including:
   *   - page: Current page number
   *   - limit: Number of items per page
   *   - summary: Flag to return summarized customer data
   *   - search: Search term to filter customers
   *
   * @returns A Promise containing either:
   *   - ListResponse<CustomerListResponse>: Detailed customer information
   *   - ListResponse<CustomerSummary>: Summarized customer information
   *
   * @remarks
   * The results are cached using a composite key of the query parameters.
   * Cache is managed through cacheUtil.getCachedResponse.
   */
  @Get()
  findAll(
    @GetUser() user: User,
    @Query() params: PaginationDto,
  ): Promise<ListResponse<CustomerListResponse | CustomerSummary>> {
    const { page, limit, summary, search } = params;
    const cacheKey = `customer:all:${page}:${limit}:${summary}:${search}`;

    return CacheUtil.getCachedResponse({
      cacheKey,
      cacheManager: this.cacheManager,
      callback: () => this.customerService.findAll(user, params),
    });
  }

  /**
   * Clears the customer service cache.
   * This endpoint removes all cached customer data from the service.
   *
   * @returns {Promise<string>} A message confirming the cache has been cleared
   * @throws {Error} If there's an error clearing the cache
   */
  @Get('clear_cache')
  async clearCache(): Promise<string> {
    await this.customerService.clearCache();
    return 'Cache cleared';
  }

  /**
   * Retrieves a single customer by their ID, with caching support
   *
   * @param {string} id - The CUID identifier of the customer to retrieve
   * @param {User} user - The authenticated user making the request
   * @returns {Promise<CustomerResponse>} A promise that resolves to the customer data
   *
   * @throws {NotFoundException} When customer is not found
   * @throws {ForbiddenException} When user doesn't have permission to access the customer
   *
   * @example
   * // Returns cached customer if available, otherwise fetches from database
   * findOne('cuid123', user)
   */
  @Get(':id')
  findOne(@Param('id', ParseCuidPipe) id: string, @GetUser() user: User): Promise<CustomerResponse> {
    return CacheUtil.getCachedResponse({
      cacheKey: `customer:id:${id}`,
      cacheManager: this.cacheManager,
      callback: () => this.customerService.findOne(id, user),
    });
  }

  /**
   * Retrieves a customer by their code with caching support
   *
   * @param code - The unique numeric identifier of the customer
   * @param user - The currently authenticated user making the request
   * @returns Promise containing the customer response data
   *
   * @remarks
   * This endpoint implements caching using a Redis cache manager.
   * The cache key is generated using the pattern `customer:code:{code}`.
   *
   * @throws {NotFoundException} When no customer is found with the given code
   * @throws {ForbiddenException} When the user doesn't have permission to access the customer
   */
  @Get('code/:code')
  findByCode(@Param('code', ParseIntPipe) code: number, @GetUser() user: User): Promise<CustomerResponse> {
    return CacheUtil.getCachedResponse({
      cacheKey: `customer:code:${code}`,
      cacheManager: this.cacheManager,
      callback: () => this.customerService.findByCode(code, user),
    });
  }

  /**
   * Updates a customer's information by their ID.
   *
   * @param id - The unique CUID identifier of the customer to update
   * @param updateCustomerDto - The DTO containing the customer data to update
   * @param user - The currently authenticated user performing the update
   * @returns A Promise that resolves to the updated customer response
   *
   * @throws {NotFoundException} When customer with given ID is not found
   * @throws {ForbiddenException} When user doesn't have permission to update the customer
   */
  @Patch(':id')
  update(
    @Param('id', ParseCuidPipe) id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @GetUser() user: User,
  ): Promise<CustomerResponse> {
    return this.customerService.update(id, updateCustomerDto, user);
  }

  /**
   * Removes a customer from the system
   * @param id - The unique identifier (CUID) of the customer to be removed
   * @param user - The currently authenticated user making the request
   * @returns Promise containing the removed customer's data
   * @throws UnauthorizedException if user doesn't have permission to remove the customer
   * @throws NotFoundException if customer with given id doesn't exist
   */
  @Delete(':id')
  remove(@Param('id', ParseCuidPipe) id: string, @GetUser() user: User): Promise<CustomerResponse> {
    return this.customerService.remove(id, user);
  }

  /**
   * Restores a previously soft-deleted customer.
   *
   * @param {string} id - The CUID identifier of the customer to restore
   * @param {User} user - The current authenticated user performing the restoration
   * @returns {Promise<CustomerResponse>} A promise that resolves to the restored customer data
   * @throws {NotFoundException} When the customer with the given ID is not found
   * @throws {UnauthorizedException} When the user doesn't have permission to restore customers
   */
  @Patch(':id/restore')
  restore(@Param('id', ParseCuidPipe) id: string, @GetUser() user: User): Promise<CustomerResponse> {
    return this.customerService.restore(id, user);
  }
}
