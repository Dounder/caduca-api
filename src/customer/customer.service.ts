import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Customer, Role } from '@prisma/client';

import { ListResponse, PaginationDto } from 'src/common';
import { ExceptionHandler, hasRoles, ObjectManipulator } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrentUser } from 'src/user';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';

const EXCLUDE_FIELDS: (keyof Customer)[] = ['createdById', 'updatedById', 'deletedById'];
const INCLUDE_LIST = {
  createdBy: { select: { id: true, username: true, email: true } },
};
const INCLUDE_SINGLE = {
  ...INCLUDE_LIST,
  updatedBy: { select: { id: true, username: true, email: true } },
  deletedBy: { select: { id: true, username: true, email: true } },
};

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
        include: INCLUDE_SINGLE,
      });

      this.clearCache();

      return this.excludeFields(customer);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async findAll(pagination: PaginationDto, user: CurrentUser): Promise<ListResponse<Customer>> {
    this.logger.log(`Fetching customers: ${JSON.stringify(pagination)}, user: ${user.username} (${user.id})`);
    const { page, limit } = pagination;
    const isAdmin = hasRoles(user.roles, [Role.Admin]);
    const where = isAdmin ? {} : { deletedAt: null };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where,
        include: INCLUDE_LIST,
      }),
      this.prisma.customer.count({ where }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return { meta: { total, page, lastPage }, data: data.map(this.excludeFields) };
  }

  async findOne(id: string, user: CurrentUser): Promise<Partial<Customer>> {
    this.logger.log(`Fetching customer: ${id}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [Role.Admin]);
      const where = isAdmin ? { id } : { id, deletedAt: null };

      const customer = await this.prisma.customer.findUnique({
        where,
        include: INCLUDE_SINGLE,
      });

      if (!customer)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Customer with id ${id} not found`,
        });

      return this.excludeFields(customer);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async findByCode(code: number, user: CurrentUser): Promise<Partial<Customer>> {
    this.logger.log(`Fetching customer: ${code}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [Role.Admin]);
      const where = isAdmin ? { code } : { code, deletedAt: null };

      const customer = await this.prisma.customer.findUnique({
        where,
        include: INCLUDE_SINGLE,
      });

      if (!customer)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Customer with code ${code} not found`,
        });

      return this.excludeFields(customer);
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
        include: INCLUDE_SINGLE,
      });

      this.clearCache();

      return this.excludeFields(updatedCustomer);
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
        include: INCLUDE_SINGLE,
      });

      this.clearCache();

      return this.excludeFields(deletedCustomer);
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
        include: INCLUDE_SINGLE,
      });

      this.clearCache();

      return this.excludeFields(restoredCustomer);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  private clearCache() {
    this.cacheManager.reset();
  }

  /**
   * Excludes specified fields from the given Customer object.
   *
   * @param data - The Customer object from which fields will be excluded.
   * @returns A new Customer object with the specified fields excluded.
   */
  private excludeFields(data: Customer): Partial<Customer> {
    return ObjectManipulator.exclude<Customer>(data, EXCLUDE_FIELDS);
  }
}
