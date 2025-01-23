import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { CacheUtil, ExceptionHandler, hasRoles, ListResponse, PaginationDto } from 'src/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { USER_SELECT_LIST, USER_SELECT_LIST_SUMMARY, USER_SELECT_SINGLE } from './helpers';
import { PrismaUser, RoleId, User, UserSummary, UserWithPwd } from './interfaces';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Creates a new user in the system
   *
   * @param createUserDto - The data transfer object containing the user information
   * @param user - The authenticated user creating the new user
   * @returns Promise containing the created user with temporary password
   *
   * @remarks
   * - If no roles are specified, 'Staff' role is assigned by default
   * - If no password is provided, a random password is generated
   * - The password is hashed before storing
   * - Cache is cleared after successful creation
   *
   * @throws {BadRequestException} When username already exists
   * @throws {ConflictException} When email already exists
   * @throws Error handled by exception handler for other cases
   */
  async create(createUserDto: CreateUserDto, user: User): Promise<UserWithPwd> {
    try {
      const { password, roles, ...data } = createUserDto;
      this.logger.log(`Creating user: ${JSON.stringify({ ...data, roles })}`);

      if (roles.length === 0) roles.push(RoleId.Staff);

      const userPassword = password || this.generateRandomPassword();

      const hashedPassword = bcrypt.hashSync(userPassword, 10);

      const newUser = await this.prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
          createdById: user.id,
          userRoles: { createMany: { data: roles.map((roleId) => ({ roleId })) } },
        },
        select: USER_SELECT_SINGLE,
      });

      const [cleanUser] = this.mapUserWithRoles([newUser]);

      this.clearCache();

      return { ...cleanUser, password: userPassword };
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('username'))
        throw new BadRequestException({ status: HttpStatus.CONFLICT, message: 'Nombre de usuario ya existe' });

      if (error.code === 'P2002' && error.meta?.target?.includes('email'))
        throw new ConflictException({ status: HttpStatus.CONFLICT, message: 'Correo electrónico ya existe' });

      this.exHandler.process(error, 'Error creating the user');
    }
  }

  /**
   * Retrieves a paginated list of users from the database.
   *
   * @param user - The authenticated user making the request
   * @param params - Pagination and filtering parameters
   * @param params.page - The page number to retrieve
   * @param params.limit - The number of items per page
   * @param params.summary - If true, returns a simplified version of user data
   * @param params.search - Optional search string to filter users by username or email
   *
   * @returns A promise that resolves to a ListResponse containing:
   *          - meta: Pagination metadata (total count, current page, last page)
   *          - data: Array of User or UserSummary objects
   *
   * @remarks
   * - Admin users can see soft-deleted users, regular users cannot
   * - Search is case-insensitive and matches both username and email
   * - Results are ordered by creation date (newest first)
   * - When summary is true, returns simplified user data (UserSummary)
   * - When summary is false, returns full user data with mapped roles
   */
  async findAll(user: User, params: PaginationDto): Promise<ListResponse<User | UserSummary>> {
    this.logger.log(`Fetching users: ${JSON.stringify(params)}, user: ${user.id} - ${user.username}`);
    const { page, limit, summary, search } = params;
    const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
    const where = {
      AND: [
        isAdmin ? {} : { deletedAt: null },
        search
          ? {
              OR: [
                { username: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {},
      ],
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where,
        orderBy: { createdAt: 'desc' },
        select: summary ? USER_SELECT_LIST_SUMMARY : USER_SELECT_LIST,
      }),
      this.prisma.user.count({ where }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return {
      meta: { total, page, lastPage },
      data: summary ? data : this.mapUserWithRoles(data as PrismaUser[]),
    };
  }

  /**
   * Retrieves a single user by their ID, with permission handling based on the requesting user's role.
   *
   * @param id - The unique identifier of the user to retrieve
   * @param currentUser - The user making the request
   *
   * @returns A Promise that resolves to the found User entity with mapped roles
   *
   * @throws {NotFoundException} When no user is found with the given ID
   *
   * @remarks
   * - If the requesting user is an Admin, they can see both active and deleted users
   * - Non-admin users can only see active (non-deleted) users
   * - The returned user object includes mapped roles through {@link mapUserWithRoles}
   */
  async findOne(id: string, currentUser: User): Promise<User> {
    this.logger.log(`Fetching user: ${id}, user: ${currentUser.id} - ${currentUser.username}`);
    const isAdmin = hasRoles(currentUser.roles, [RoleId.Admin]);

    const where = isAdmin ? { id } : { id, deletedAt: null };

    const user = await this.prisma.user.findFirst({ where, select: USER_SELECT_SINGLE });

    if (!user)
      throw new NotFoundException({ status: HttpStatus.NOT_FOUND, message: `[ERROR] User with id ${id} not found` });

    return this.mapUserWithRoles([user])[0];
  }

  /**
   * Finds a user by their username
   *
   * @param username - The username to search for
   * @param currentUser - The user making the request
   *
   * @returns Promise containing the found user with mapped roles
   *
   * @throws {NotFoundException} When user is not found
   *
   * @remarks
   * - If the requesting user has Admin role, it will search including soft-deleted users
   * - If the requesting user is not Admin, it will only search for non-deleted users
   * - The returned user will have their roles mapped through mapUserWithRoles
   */
  async findByUsername(username: string, currentUser: User): Promise<User> {
    this.logger.log(`Fetching user: ${username}, user: ${currentUser.id} - ${currentUser.username}`);
    const idAdmin = hasRoles(currentUser.roles, [RoleId.Admin]);
    const where = idAdmin ? { username } : { username, deletedAt: null };

    const user = await this.prisma.user.findFirst({ where, select: USER_SELECT_SINGLE });

    if (!user)
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: `[ERROR] User with username ${username} not found`,
      });

    return this.mapUserWithRoles([user])[0];
  }

  /**
   * Retrieves a user summary by ID with permission handling
   *
   * @param id - The unique identifier of the user to fetch
   * @param currentUser - The authenticated user making the request
   *
   * @returns A Promise containing the user summary with id, username and email
   *
   * @throws {NotFoundException} When the user is not found or is soft-deleted (for non-admin users)
   *
   * @remarks
   * - Admin users can see soft-deleted users
   * - Non-admin users can only see non-deleted users
   * - The response is filtered to only return id, username and email fields
   */
  async findOneWithSummary(id: string, currentUser: User): Promise<UserSummary> {
    this.logger.log(`Fetching user: ${id}, user: ${currentUser.id} - ${currentUser.username}`);
    const idAdmin = hasRoles(currentUser.roles, [RoleId.Admin]);
    const where = idAdmin ? { id } : { id, deletedAt: null };

    const user = await this.prisma.user.findFirst({ where, select: { id: true, username: true, email: true } });

    if (!user)
      throw new NotFoundException({ status: HttpStatus.NOT_FOUND, message: `[ERROR] User with id ${id} not found` });

    return user;
  }

  /**
   * Retrieves user summaries for a list of user IDs.
   *
   * @param ids - Array of user IDs to fetch
   * @param currentUser - The user making the request
   * @returns Promise containing an array of UserSummary objects with id, username and email
   *
   * @remarks
   * This method logs the request details including the requesting user's information.
   * The returned user summaries only include basic profile information (id, username, email).
   *
   * @example
   * ```typescript
   * const userSummaries = await userService.findByIds(['user1', 'user2'], currentUser);
   * ```
   */
  async findByIds(ids: string[], currentUser: User): Promise<UserSummary[]> {
    this.logger.log(`Fetching users: ${ids}, user: ${currentUser.id} - ${currentUser.username}`);

    const data = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, username: true, email: true },
    });

    return data;
  }

  /**
   * Updates a user's information in the system.
   *
   * @param id - The unique identifier of the user to update
   * @param data - DTO containing the updated user information (email, username, roles)
   * @param currentUser - The authenticated user performing the update operation
   *
   * @returns A Promise that resolves to the updated User entity
   *
   * @remarks
   * - This method handles both user information and role updates
   * - Roles are updated separately through updateUserRoles method
   * - The cache is cleared after successful update
   * - The updatedById field is automatically set to the current user's ID
   *
   * @throws Will throw an error if:
   * - The user to update doesn't exist
   * - The current user doesn't have permission to update the target user
   * - There are database constraints violations
   *
   * @see {@link UpdateUserDto}
   * @see {@link User}
   */
  async update(id: string, data: UpdateUserDto, currentUser: User): Promise<User> {
    try {
      this.logger.log(`Updating user: ${JSON.stringify(data)}, user: ${currentUser.id} - ${currentUser.username}`);

      // Ensure user exists
      await this.findOne(id, currentUser);
      const { email, username, roles } = data;

      // Handle roles separately
      if (roles) await this.updateUserRoles(id, roles, currentUser);

      // Update the user
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: { email, username, updatedById: currentUser.id },
        select: USER_SELECT_SINGLE,
      });

      this.clearCache();

      return this.mapUserWithRoles([updatedUser])[0];
    } catch (error) {
      this.exHandler.process(error, 'Error updating the user');
    }
  }

  /**
   * Updates the roles assigned to a user, handling role addition, removal, and restoration.
   * This method ensures atomicity through database transactions.
   *
   * @param userId - The unique identifier of the user whose roles are being updated
   * @param newRoles - Array of role IDs to be assigned to the user
   * @param currentUser - The user performing the role update operation
   *
   * @remarks
   * The method performs the following operations:
   * 1. If no roles are provided, assigns a default 'Staff' role
   * 2. Soft deletes roles that are no longer assigned (sets deletedAt)
   * 3. Restores previously deleted roles if they're being reassigned
   * 4. Creates new role assignments for roles never assigned before
   *
   * All operations are performed within a single transaction to ensure data consistency.
   *
   * @throws Will throw an error if the database transaction fails
   *
   * @example
   * ```typescript
   * await updateUserRoles('user123', ['admin', 'editor'], currentUser);
   * ```
   */
  private async updateUserRoles(userId: string, newRoles: string[], currentUser: User): Promise<void> {
    // If newRoles are empty, set a default role
    if (newRoles.length === 0) newRoles.push(RoleId.Staff);

    // Begin transaction for atomicity
    await this.prisma.$transaction(async (tx) => {
      const existingRoles = await tx.userRole.findMany({
        where: { userId, deletedAt: null },
      });

      const existingRoleIds = existingRoles.map((role) => role.roleId);

      // Roles to remove (logical delete)
      const rolesToRemove = existingRoleIds.filter((roleId) => !newRoles.includes(roleId));
      if (rolesToRemove.length > 0) {
        this.logger.log(`Roles to remove for user ${userId}: ${JSON.stringify(rolesToRemove)}`);
        await tx.userRole.updateMany({
          where: { userId, roleId: { in: rolesToRemove }, deletedAt: null },
          data: { deletedAt: new Date() },
        });
      }

      // Roles to potentially add or restore
      const rolesToAdd = newRoles.filter((roleId) => !existingRoleIds.includes(roleId));
      if (rolesToAdd.length > 0) {
        this.logger.log(`Attempting to add roles for user ${userId}: ${JSON.stringify(rolesToAdd)}`);

        // Check if any roles to add were previously assigned (but now deleted)
        const previouslyDeletedRoles = await tx.userRole.findMany({
          where: {
            userId,
            roleId: { in: rolesToAdd },
            deletedAt: { not: null },
          },
        });

        const previouslyDeletedRoleIds = previouslyDeletedRoles.map((r) => r.roleId);

        // Restore previously deleted roles
        if (previouslyDeletedRoleIds.length > 0) {
          this.logger.log(
            `Restoring previously deleted roles for user ${userId}: ${JSON.stringify(previouslyDeletedRoleIds)}`,
          );
          await tx.userRole.updateMany({
            where: {
              userId,
              roleId: { in: previouslyDeletedRoleIds },
            },
            data: {
              deletedAt: null,
              // Optionally update assignedById and assignedAt if you want to reflect the re-assignment
              assignedById: currentUser.id,
              assignedAt: new Date(),
            },
          });
        }

        // Create new roles that were never assigned before
        const newUnseenRoleIds = rolesToAdd.filter((roleId) => !previouslyDeletedRoleIds.includes(roleId));
        if (newUnseenRoleIds.length > 0) {
          this.logger.log(
            `Creating brand new role assignments for user ${userId}: ${JSON.stringify(newUnseenRoleIds)}`,
          );
          const newRoleRecords = newUnseenRoleIds.map((roleId) => ({
            userId,
            roleId,
            assignedById: currentUser.id,
            assignedAt: new Date(),
          }));
          await tx.userRole.createMany({ data: newRoleRecords });
        }
      }
    });
  }

  /**
   * Marks a user as deleted by setting their deletedAt timestamp and tracking who deleted them.
   * This is a soft delete operation - the user record remains in the database but is marked as inactive.
   *
   * @param id - The unique identifier of the user to be deleted
   * @param currentUser - The authenticated user performing the deletion
   * @returns Promise<User> - The updated user object with deletion details
   *
   * @throws ConflictException
   * When attempting to delete a user that is already marked as deleted
   *
   * @remarks
   * - This method performs a soft delete by updating the deletedAt and deletedById fields
   * - After deletion, the cache is cleared to ensure data consistency
   * - The returned user object includes mapped role information
   */
  async remove(id: string, currentUser: User): Promise<User> {
    try {
      this.logger.log(`Removing user: ${id}, user: ${currentUser.id} - ${currentUser.username}`);

      const user = await this.findOne(id, currentUser);

      if (user.deletedAt)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] User with id ${id} is already disabled`,
        });

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date(), deletedById: currentUser.id },
        select: USER_SELECT_SINGLE,
      });

      this.clearCache();

      return this.mapUserWithRoles([updatedUser])[0];
    } catch (error) {
      this.exHandler.process(error, 'Error removing the user');
    }
  }

  /**
   * Restores a previously deleted user by clearing their deletion status
   *
   * @param id - The unique identifier of the user to restore
   * @param currentUser - The authenticated user performing the restore action
   *
   * @throws {ConflictException} If the user is already active (not deleted)
   * @throws {ForbiddenException} If the current user lacks permission to restore users
   * @throws {NotFoundException} If the user with the given ID is not found
   *
   * @returns {Promise<User>} The restored user with their associated roles
   *
   * @remarks
   * This method will:
   * - Verify the user exists and is currently deleted
   * - Clear the deletedAt and deletedById fields
   * - Update the updatedById field with the current user's ID
   * - Clear any cached user data
   * - Return the restored user with their mapped roles
   */
  async restore(id: string, currentUser: User): Promise<User> {
    try {
      this.logger.log(`Restoring user: ${id}, user: ${currentUser.id} - ${currentUser.username}`);
      const user = await this.findOne(id, currentUser);

      if (user.deletedAt === null)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] User with id ${id} is already enabled`,
        });

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: { deletedAt: null, deletedById: null, updatedById: currentUser.id },
        select: USER_SELECT_SINGLE,
      });

      this.clearCache();

      return this.mapUserWithRoles([updatedUser])[0];
    } catch (error) {
      this.exHandler.process(error, 'Error restoring the user');
    }
  }

  /**
   * Generates a random password of specified length using alphanumeric characters.
   *
   * @param length - The desired length of the password. Defaults to 6 characters.
   * @returns A randomly generated password string containing letters and numbers.
   *
   * @remarks
   * The password will contain a mix of:
   * - Uppercase letters (A-Z)
   * - Lowercase letters (a-z)
   * - Numbers (0-9)
   *
   * Note: This is a basic implementation and may not be suitable for production security requirements.
   * Consider using a more cryptographically secure method for sensitive applications.
   */
  private generateRandomPassword(length: number = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let generatedPassword = '';

    const charsLength = chars.length;

    for (let i = 0; i < length; i++) generatedPassword += chars.charAt(Math.floor(Math.random() * charsLength));

    return generatedPassword;
  }

  /**
   * Clears all cached user-related data using a wildcard pattern.
   *
   * @remarks
   * This method uses the CacheUtil helper to clear all cache entries
   * that match the pattern 'user:*'. This is typically called after
   * operations that modify user data to ensure cache consistency.
   *
   * @private
   * @async
   * @returns {Promise<void>} A promise that resolves when the cache clearing operation is complete
   *
   * @throws {Error} If there's an issue accessing the cache manager
   * or if the clearing operation fails
   */
  private async clearCache(): Promise<void> {
    await CacheUtil.clearCache(this.cacheManager, 'user:*');
  }

  /**
   * Maps Prisma User entities to User DTOs by extracting role information.
   *
   * @param users - Array of Prisma User entities containing nested userRoles data
   * @returns Array of User DTOs with flattened role information
   *
   * @remarks
   * This method transforms the nested userRoles structure from Prisma into a simplified
   * roles array containing only id and name properties.
   *
   * @example
   * ```ts
   * // Input Prisma User with nested roles
   * [{
   *   id: 1,
   *   name: "John",
   *   userRoles: [{ role: { id: 1, name: "admin" } }]
   * }]
   *
   * // Output transformed User
   * [{
   *   id: 1,
   *   name: "John",
   *   roles: [{ id: 1, name: "admin" }]
   * }]
   * ```
   */
  private mapUserWithRoles(users: PrismaUser[]): User[] {
    return users.map(({ userRoles, ...user }) => ({
      ...user,
      roles: userRoles.map(({ role }) => ({ id: role.id, name: role.name })),
    }));
  }
}
