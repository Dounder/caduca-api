import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Salesperson } from '@prisma/client';

import { ListResponse, PaginationDto } from 'src/common';
import { ExceptionHandler, hasRoles, ObjectManipulator } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrentUser, Role } from 'src/user';
import { CreateSalespersonDto, UpdateSalespersonDto } from './dto';
import { SalespersonResponse } from './interfaces/salesperson.interface';

const EXCLUDE_FIELDS: (keyof Salesperson)[] = ['createdById', 'updatedById', 'deletedById'];
const INCLUDE_LIST = {
  createdBy: { select: { id: true, username: true, email: true } },
};
const INCLUDE_SINGLE = {
  ...INCLUDE_LIST,
  updatedBy: { select: { id: true, username: true, email: true } },
  deletedBy: { select: { id: true, username: true, email: true } },
};

@Injectable()
export class SalespersonService {
  private readonly logger = new Logger(SalespersonService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, SalespersonService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly prisma: PrismaService,
  ) {}

  async create(createSalespersonDto: CreateSalespersonDto, user: CurrentUser): Promise<SalespersonResponse> {
    const message = `Creating salesperson: ${JSON.stringify(createSalespersonDto)}, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      const salesperson = await this.prisma.salesperson.create({
        data: {
          ...createSalespersonDto,
          createdBy: { connect: { id: user.id } },
          logs: { create: { message, createdBy: { connect: { id: user.id } } } },
        },
        include: INCLUDE_SINGLE,
      });

      await this.cacheManager.reset();

      return this.excludeFields(salesperson);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async findAll(pagination: PaginationDto, user: CurrentUser): Promise<ListResponse<SalespersonResponse>> {
    this.logger.log(`Fetching salesperson: ${JSON.stringify(pagination)}, user: ${user.username} (${user.id})`);
    const { page, limit } = pagination;
    const isAdmin = hasRoles(user.roles, [Role.Admin]);
    const where = isAdmin ? {} : { deletedAt: null };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.salesperson.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where,
        include: INCLUDE_LIST,
      }),
      this.prisma.salesperson.count({ where }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return { meta: { total, page, lastPage }, data: data.map(this.excludeFields) };
  }

  async findOne(id: string, user: CurrentUser): Promise<SalespersonResponse> {
    this.logger.log(`Fetching salesperson: ${id}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [Role.Admin]);
      const where = isAdmin ? { id } : { id, deletedAt: null };

      const salesperson = await this.prisma.salesperson.findFirst({ where, include: INCLUDE_SINGLE });

      if (!salesperson)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Salesperson with id ${id} not found`,
        });

      return this.excludeFields(salesperson);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async findOneByCode(code: number, user: CurrentUser): Promise<SalespersonResponse> {
    this.logger.log(`Fetching salesperson by code: ${code}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [Role.Admin]);
      const where = isAdmin ? { code } : { code, deletedAt: null };

      const salesperson = await this.prisma.salesperson.findFirst({ where, include: INCLUDE_SINGLE });

      if (!salesperson)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Salesperson with code ${code} not found`,
        });

      return this.excludeFields(salesperson);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async update(id: string, updateSalespersonDto: UpdateSalespersonDto, user: CurrentUser) {
    const message = `Updating salesperson: ${JSON.stringify(updateSalespersonDto)}, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      await this.findOne(id, user);

      const updatedSalesperson = await this.prisma.salesperson.update({
        where: { id },
        data: {
          ...updateSalespersonDto,
          updatedBy: { connect: { id: user.id } },
          logs: { create: { message, createdBy: { connect: { id: user.id } } } },
        },
        include: INCLUDE_SINGLE,
      });

      await this.clearCache();

      return this.excludeFields(updatedSalesperson);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async remove(id: string, user: CurrentUser) {
    const message = `Deleting salesperson: ${id}, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      const salesperson = await this.findOne(id, user);

      if (salesperson.deletedAt)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Salesperson with id ${id} already deleted`,
        });

      const deletedSalesperson = await this.prisma.salesperson.update({
        where: { id },
        data: {
          deletedBy: { connect: { id: user.id } },
          logs: { create: { message, createdBy: { connect: { id: user.id } } } },
          deletedAt: new Date(),
        },
        include: INCLUDE_SINGLE,
      });

      await this.cacheManager.reset();

      return this.excludeFields(deletedSalesperson);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async restore(id: string, user: CurrentUser) {
    const message = `Restoring salesperson: ${id}, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      const salesperson = await this.findOne(id, user);

      if (!salesperson.deletedAt)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Salesperson with id ${id} not deleted`,
        });

      const restoredSalesperson = await this.prisma.salesperson.update({
        where: { id },
        data: {
          deletedBy: { connect: { id: user.id } },
          logs: { create: { message, createdBy: { connect: { id: user.id } } } },
          deletedAt: null,
        },
        include: INCLUDE_SINGLE,
      });

      await this.clearCache();

      return this.excludeFields(restoredSalesperson);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  private excludeFields(data: Salesperson): SalespersonResponse {
    return ObjectManipulator.exclude<Salesperson>(data, EXCLUDE_FIELDS) as SalespersonResponse;
  }

  private async clearCache() {
    this.logger.log('Clearing cache');
    const keys = await this.cacheManager.store.keys('salesperson:*');
    if (keys.length > 0) await this.cacheManager.store.mdel(...keys);
  }
}
