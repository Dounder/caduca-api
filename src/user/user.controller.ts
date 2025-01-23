import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';

import { Auth, GetUser } from 'src/auth';
import { CacheUtil, ListResponse, PaginationDto, ParseCuidPipe } from 'src/common';
import { CreateUserDto, UpdateUserDto } from './dto';
import { RoleId, User, UserSummary } from './interfaces';
import { UserService } from './user.service';

@Controller('user')
@Auth(RoleId.Admin, RoleId.Developer, RoleId.Manager)
export class UserController {
  constructor(
    private readonly usersService: UserService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Returns a health check message indicating the users service status
   * @remarks This endpoint can be used to verify if the users service is operational
   * @returns A string message confirming the service is running
   */
  @Get('user.health')
  health(): string {
    return 'users service is up and running!';
  }

  /**
   * Creates a new user in the system
   * @param createUserDto - The data transfer object containing the user information to create
   * @param user - The authenticated user performing the creation
   * @returns Promise that resolves to the newly created User entity
   * @throws UnauthorizedException if the authenticated user doesn't have sufficient permissions
   * @throws BadRequestException if the provided data is invalid
   */
  @Post()
  create(@Body() createUserDto: CreateUserDto, @GetUser() user: User): Promise<User> {
    return this.usersService.create(createUserDto, user);
  }

  /**
   * Retrieves a paginated list of users with optional caching.
   *
   * @param user - The authenticated user making the request
   * @param params - Pagination parameters including page number, limit, summary flag, and search term
   * @returns A promise that resolves to a paginated list response containing user records
   *
   * @remarks
   * This endpoint implements caching using a composite key based on the query parameters.
   * The cache key format is: `user:page:{page}:limit:{limit}:summary:{summary}:search:{search}`
   *
   * @example
   * ```typescript
   * // Get first page with 10 items
   * findAll(authUser, { page: 1, limit: 10, summary: false, search: '' })
   * ```
   */
  @Get()
  findAll(@GetUser() user: User, @Query() params: PaginationDto): Promise<ListResponse<User>> {
    const cacheKey = `user:page:${params.page}:limit:${params.limit}:summary:${params.summary}:search:${params.search}`;
    return CacheUtil.getCachedResponse({
      cacheKey,
      cacheManager: this.cacheManager,
      callback: () => this.usersService.findAll(user, params),
    });
  }

  /**
   * Retrieves a single user by their ID, with caching support
   *
   * @param id - The CUID of the user to retrieve
   * @param user - The authenticated user making the request
   *
   * @returns A Promise that resolves to the requested User entity
   *
   * @remarks
   * This endpoint implements caching using a cache key in the format `user:{id}`.
   * The actual user lookup is only performed if there's a cache miss.
   *
   * @throws {NotFoundException} When the requested user is not found
   * @throws {ForbiddenException} When the authenticated user lacks permissions
   */
  @Get(':id')
  findOne(@Param('id', ParseCuidPipe) id: string, @GetUser() user: User): Promise<User> {
    return CacheUtil.getCachedResponse({
      cacheKey: `user:${id}`,
      cacheManager: this.cacheManager,
      callback: () => this.usersService.findOne(id, user),
    });
  }

  /**
   * Retrieves a user by their username.
   * Results are cached to improve performance on subsequent requests.
   *
   * @param username - The username of the user to find
   * @param user - The authenticated user making the request
   * @returns Promise that resolves to the found User entity
   *
   * @throws NotFoundException
   *    When no user is found with the given username
   * @throws UnauthorizedException
   *    When the authenticated user doesn't have permission to view the requested user
   *
   * @remarks
   * The response is cached using the pattern `user:username:{username}`.
   * Cache invalidation should be handled when the user data is updated.
   */
  @Get('username/:username')
  findOneByUsername(@Param('username') username: string, @GetUser() user: User): Promise<User> {
    return CacheUtil.getCachedResponse({
      cacheKey: `user:username:${username}`,
      cacheManager: this.cacheManager,
      callback: () => this.usersService.findByUsername(username, user),
    });
  }

  /**
   * Retrieves a user summary with caching support
   *
   * @param id - The CUID identifier of the user to retrieve
   * @param user - The authenticated user making the request
   * @returns A Promise that resolves to a UserSummary object
   *
   * @remarks
   * This endpoint implements caching using a cache key pattern of `user:{id}:summary`.
   * The cache is managed through CacheUtil.getCachedResponse which handles cache retrieval and storage.
   *
   * @throws {NotFoundException} When the user is not found
   * @throws {ForbiddenException} When the authenticated user doesn't have permission to view the summary
   */
  @Get(':id/summary')
  findOneWithSummary(@Param('id', ParseCuidPipe) id: string, @GetUser() user: User): Promise<UserSummary> {
    return CacheUtil.getCachedResponse({
      cacheKey: `user:${id}:summary`,
      cacheManager: this.cacheManager,
      callback: () => this.usersService.findOneWithSummary(id, user),
    });
  }

  /**
   * Updates an existing user's information.
   *
   * @param id - The CUID of the user to update
   * @param updateUserDto - The DTO containing the fields to update
   * @param user - The authenticated user performing the update
   * @returns Promise containing the updated user
   *
   * @throws UnauthorizedException
   * If the authenticated user lacks permissions to update the target user
   *
   * @throws NotFoundException
   * If no user is found with the given id
   *
   * @remarks
   * The id parameter is automatically validated through ParseCuidPipe
   */
  @Patch(':id')
  update(
    @Param('id', ParseCuidPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: User,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto, user);
  }

  /**
   * Removes a user from the system.
   *
   * @param {string} id - The CUID of the user to be removed. Must be a valid CUID string.
   * @param {User} user - The authenticated user performing the removal operation.
   * @returns {Promise<User>} A promise that resolves to the removed user's data.
   *
   * @throws {UnauthorizedException} If the authenticated user lacks permission to remove the target user.
   * @throws {NotFoundException} If no user is found with the provided CUID.
   *
   * @remarks
   * The authenticated user must have appropriate permissions to remove other users.
   * The operation is permanent and cannot be undone.
   */
  @Delete(':id')
  @Auth(RoleId.Admin, RoleId.Developer)
  remove(@Param('id', ParseCuidPipe) id: string, @GetUser() user: User): Promise<User> {
    return this.usersService.remove(id, user);
  }

  /**
   * Restores a previously soft-deleted user from the system.
   *
   * @param id - The CUID identifier of the user to restore
   * @param user - The authenticated user performing the restore operation
   * @returns Promise that resolves to the restored User entity
   *
   * @throws UnauthorizedException
   * If the authenticated user doesn't have sufficient permissions
   *
   * @throws NotFoundException
   * If no soft-deleted user is found with the given id
   *
   * @remarks
   * This endpoint only works for soft-deleted users. If the user was hard-deleted,
   * this operation will fail. The authenticated user must have proper authorization
   * to perform restore operations.
   */
  @Patch(':id/restore')
  @Auth(RoleId.Admin, RoleId.Developer)
  restore(@Param('id', ParseCuidPipe) id: string, @GetUser() user: User): Promise<User> {
    return this.usersService.restore(id, user);
  }
}
