import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { FindAllParams, ListResponse, SummaryPaginationDto } from 'src/common';
import { ExceptionHandler, hasRoles } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrentUser, RoleId } from 'src/user';
import { CreateSalespersonDto, UpdateSalespersonDto } from './dto';
import { SALESPERSON_SELECT_LIST, SALESPERSON_SELECT_LIST_SUMMARY, SALESPERSON_SELECT_SINGLE } from './helper';
import { SalespersonResponse } from './interfaces/salesperson.interface';

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
        select: SALESPERSON_SELECT_SINGLE,
      });

      await this.cacheManager.reset();

      return salesperson;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async findAll(user: CurrentUser, params: SummaryPaginationDto): Promise<ListResponse<SalespersonResponse>> {
    this.logger.log(`Fetching salesperson: ${JSON.stringify(params)}, user: ${user.username} (${user.id})`);
    const { page, limit, summary } = params;
    const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
    const where = isAdmin ? {} : { deletedAt: null };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.salesperson.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where,
        select: summary ? SALESPERSON_SELECT_LIST_SUMMARY : SALESPERSON_SELECT_LIST,
      }),
      this.prisma.salesperson.count({ where }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return { meta: { total, page, lastPage }, data };
  }

  async findOne(id: string, user: CurrentUser): Promise<SalespersonResponse> {
    this.logger.log(`Fetching salesperson: ${id}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
      const where = isAdmin ? { id } : { id, deletedAt: null };

      const salesperson = await this.prisma.salesperson.findFirst({ where, select: SALESPERSON_SELECT_SINGLE });

      if (!salesperson)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Salesperson with id ${id} not found`,
        });

      return salesperson;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async findOneByCode(code: number, user: CurrentUser): Promise<SalespersonResponse> {
    this.logger.log(`Fetching salesperson by code: ${code}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
      const where = isAdmin ? { code } : { code, deletedAt: null };

      const salesperson = await this.prisma.salesperson.findFirst({ where, select: SALESPERSON_SELECT_SINGLE });

      if (!salesperson)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Salesperson with code ${code} not found`,
        });

      return salesperson;
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
        select: SALESPERSON_SELECT_SINGLE,
      });

      await this.clearCache();

      return updatedSalesperson;
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
        select: SALESPERSON_SELECT_SINGLE,
      });

      await this.cacheManager.reset();

      return deletedSalesperson;
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
        select: SALESPERSON_SELECT_SINGLE,
      });

      await this.clearCache();

      return restoredSalesperson;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  private async clearCache() {
    this.logger.log('Clearing cache');
    const keys = await this.cacheManager.store.keys('salesperson:*');
    if (keys.length > 0) await this.cacheManager.store.mdel(...keys);
  }
}
