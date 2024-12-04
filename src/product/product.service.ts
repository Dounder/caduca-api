import { ConflictException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { FindAllParams, PaginationDto } from 'src/common';
import { ExceptionHandler, hasRoles } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrentUser, RoleId } from 'src/user';
import { CreateProductDto, UpdateProductDto } from './dto';
import { PRODUCT_SELECT_LIST, PRODUCT_SELECT_LIST_SUMMARY, PRODUCT_SELECT_SINGLE } from './helper';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, ProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

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
        select: PRODUCT_SELECT_SINGLE,
      });

      await this.clearCache();

      return product;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async findAll({ pagination, user, summary = false }: FindAllParams) {
    this.logger.log(`Fetching products: ${JSON.stringify(pagination)}, user: ${user.username} (${user.id})`);
    const { page, limit } = pagination;
    const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
    const where = isAdmin ? {} : { deletedAt: null };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where,
        select: summary ? PRODUCT_SELECT_LIST_SUMMARY : PRODUCT_SELECT_LIST,
        orderBy: { createdAt: Prisma.SortOrder.desc },
      }),
      this.prisma.product.count({ where }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return { meta: { total, page, lastPage }, data };
  }

  async findOne(id: string, user: CurrentUser) {
    this.logger.log(`Fetching product: ${id}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
      const where = isAdmin ? { id } : { id, deletedAt: null };

      const product = await this.prisma.product.findFirst({ where, select: PRODUCT_SELECT_SINGLE });

      if (!product)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Product with id ${id} not found`,
        });

      return product;
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
        select: PRODUCT_SELECT_SINGLE,
      });

      await this.clearCache();

      return product;
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
        select: PRODUCT_SELECT_SINGLE,
      });

      if (product.deletedAt !== null)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Product with id ${id} is already deleted`,
        });

      await this.clearCache();

      return product;
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
        select: PRODUCT_SELECT_SINGLE,
      });

      if (product.deletedAt === null)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Product with id ${id} is already restored`,
        });

      await this.clearCache();

      return product;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async clearCache() {
    this.logger.log('Clearing customer cache');
    const keys = await this.cacheManager.store.keys('product:*');
    if (keys.length > 0) await this.cacheManager.store.mdel(...keys);
  }
}
