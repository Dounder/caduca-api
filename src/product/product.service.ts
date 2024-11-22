import { ConflictException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';

import { PaginationDto } from 'src/common';
import { ExceptionHandler, hasRoles, ObjectManipulator } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrentUser, RoleId } from 'src/user';
import { CreateProductDto, UpdateProductDto } from './dto';

const EXCLUDE_FIELDS: (keyof Product)[] = ['createdById', 'updatedById', 'deletedById'];
const PRODUCT_INCLUDE_SINGLE = {
  codes: { select: { id: true, code: true }, where: { deletedAt: null }, orderBy: { code: Prisma.SortOrder.asc } },
  createdBy: { select: { id: true, username: true, email: true } },
  updatedBy: { select: { id: true, username: true, email: true } },
  deletedBy: { select: { id: true, username: true, email: true } },
};
const PRODUCT_INCLUDE_LIST = {
  createdBy: { select: { id: true, username: true, email: true } },
};

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, ProductService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, user: CurrentUser): Promise<Partial<Product>> {
    this.logger.log(`Creating product: ${JSON.stringify(createProductDto)}, user: ${user.username} (${user.id})`);
    try {
      const product = await this.prisma.product.create({
        data: {
          ...createProductDto,
          createdBy: { connect: { id: user.id } },
          updatedBy: { connect: { id: user.id } },
          codes: { create: { createdBy: { connect: { id: user.id } } } },
        },
        include: PRODUCT_INCLUDE_SINGLE,
      });

      return this.excludeProductFields(product);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async findAll(pagination: PaginationDto, user: CurrentUser) {
    this.logger.log(`Fetching products: ${JSON.stringify(pagination)}, user: ${user.username} (${user.id})`);
    const { page, limit } = pagination;
    const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
    const where = isAdmin ? {} : { deletedAt: null };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where,
        include: PRODUCT_INCLUDE_LIST,
        orderBy: { createdAt: Prisma.SortOrder.desc },
      }),
      this.prisma.product.count({ where }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return { meta: { total, page, lastPage }, data: data.map(this.excludeProductFields) };
  }

  async findOne(id: string, user: CurrentUser) {
    this.logger.log(`Fetching product: ${id}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
      const where = isAdmin ? { id } : { id, deletedAt: null };

      const product = await this.prisma.product.findFirst({
        where,
        include: PRODUCT_INCLUDE_SINGLE,
      });

      if (!product)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Product with id ${id} not found`,
        });

      return this.excludeProductFields(product);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: CurrentUser) {
    this.logger.log(
      `Updating product: ${JSON.stringify({ id, ...updateProductDto })}, user: ${user.username} (${user.id})`,
    );
    try {
      await this.findOne(id, user);

      const product = await this.prisma.product.update({
        where: { id },
        data: {
          ...updateProductDto,
          updatedBy: { connect: { id: user.id } },
        },
        include: PRODUCT_INCLUDE_SINGLE,
      });

      return this.excludeProductFields(product);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async remove(id: string, user: CurrentUser) {
    this.logger.log(`Deleting product: ${id}, user: ${user.username} (${user.id})`);
    try {
      await this.findOne(id, user);

      const product = await this.prisma.product.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: { connect: { id: user.id } },
        },
        include: PRODUCT_INCLUDE_SINGLE,
      });

      if (product.deletedAt !== null)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Product with id ${id} is already deleted`,
        });

      return this.excludeProductFields(product);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async restore(id: string, user: CurrentUser) {
    this.logger.log(`Restoring product: ${id}, user: ${user.username} (${user.id})`);
    try {
      await this.findOne(id, user);

      const product = await this.prisma.product.update({
        where: { id },
        data: {
          deletedAt: null,
          deletedBy: { disconnect: true },
        },
        include: PRODUCT_INCLUDE_SINGLE,
      });

      if (product.deletedAt === null)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Product with id ${id} is already restored`,
        });

      return this.excludeProductFields(product);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  private excludeProductFields(item: Product): Partial<Product> {
    return ObjectManipulator.exclude<Product>(item, EXCLUDE_FIELDS);
  }
}
