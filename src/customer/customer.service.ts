import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Customer } from '@prisma/client';

import { ListResponse, PaginationDto } from 'src/common';
import { ExceptionHandler, hasRoles } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrentUser, RoleId } from 'src/user';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';
import { CUSTOMER_SELECT_LIST, CUSTOMER_SELECT_LIST_SUMMARY, CUSTOMER_SELECT_SINGLE } from './helper';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, CustomerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(createCustomerDto: CreateCustomerDto, user: CurrentUser) {
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

  async findAll(user: CurrentUser, params: PaginationDto): Promise<ListResponse<Customer>> {
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

  async findOne(id: string, user: CurrentUser): Promise<Partial<Customer>> {
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

  async findByCode(code: number, user: CurrentUser): Promise<Partial<Customer>> {
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

  async update(id: string, updateCustomerDto: UpdateCustomerDto, user: CurrentUser): Promise<Partial<Customer>> {
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

  async remove(id: string, user: CurrentUser) {
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

  async restore(id: string, user: CurrentUser) {
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

  async clearCache() {
    this.logger.log('Clearing customer cache');
    const keys = await this.cacheManager.store.keys('customer:*');
    if (keys.length > 0) await this.cacheManager.store.mdel(...keys);
  }
}
