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

import { ExceptionHandler, hasRoles, ListResponse, PaginationDto } from 'src/common';
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

  async findOne(id: string, currentUser: User): Promise<User> {
    this.logger.log(`Fetching user: ${id}, user: ${currentUser.id} - ${currentUser.username}`);
    const isAdmin = hasRoles(currentUser.roles, [RoleId.Admin]);

    const where = isAdmin ? { id } : { id, deletedAt: null };

    const user = await this.prisma.user.findFirst({ where, select: USER_SELECT_SINGLE });

    if (!user)
      throw new NotFoundException({ status: HttpStatus.NOT_FOUND, message: `[ERROR] User with id ${id} not found` });

    return this.mapUserWithRoles([user])[0];
  }

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

  async findOneWithSummary(id: string, currentUser: User): Promise<UserSummary> {
    this.logger.log(`Fetching user: ${id}, user: ${currentUser.id} - ${currentUser.username}`);
    const idAdmin = hasRoles(currentUser.roles, [RoleId.Admin]);
    const where = idAdmin ? { id } : { id, deletedAt: null };

    const user = await this.prisma.user.findFirst({ where, select: { id: true, username: true, email: true } });

    if (!user)
      throw new NotFoundException({ status: HttpStatus.NOT_FOUND, message: `[ERROR] User with id ${id} not found` });

    return user;
  }

  async findByIds(ids: string[], currentUser: User): Promise<UserSummary[]> {
    this.logger.log(`Fetching users: ${ids}, user: ${currentUser.id} - ${currentUser.username}`);

    const data = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, username: true, email: true },
    });

    return data;
  }

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

  private generateRandomPassword(length: number = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let generatedPassword = '';

    const charsLength = chars.length;

    for (let i = 0; i < length; i++) generatedPassword += chars.charAt(Math.floor(Math.random() * charsLength));

    return generatedPassword;
  }

  private clearCache() {
    this.cacheManager.reset();
  }

  private mapUserWithRoles(users: PrismaUser[]): User[] {
    return users.map(({ userRoles, ...user }) => ({
      ...user,
      roles: userRoles.map(({ role }) => ({ id: role.id, name: role.name })),
    }));
  }
}
