import { ConflictException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Prisma } from '@prisma/client';
import { FindAllParams } from 'src/common';
import { ExceptionHandler, hasRoles } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrentUser, RoleId } from 'src/user';
import { CreateProductCodeDto } from './dto';
import { PRODUCT_CODE_SELECT_LIST, PRODUCT_CODE_SELECT_LIST_SUMMARY, PRODUCT_CODE_SELECT_SINGLE } from './helpers';

@Injectable()
export class ProductCodeService {
  private readonly logger = new Logger(ProductCodeService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, ProductCodeService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(createProductCodeDto: CreateProductCodeDto, user: CurrentUser) {
    this.logger.log(
      `Creating product code: ${JSON.stringify(createProductCodeDto)}, user: ${user.username} (${user.id})`,
    );
    try {
      const newCode = await this.prisma.productCode.create({
        data: { createdBy: { connect: { id: user.id } }, product: { connect: { id: createProductCodeDto.productId } } },
        select: PRODUCT_CODE_SELECT_SINGLE,
      });

      await this.clearCache();

      return newCode;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async findAll({ pagination, user, summary = false }: FindAllParams) {
    this.logger.log(`Fetching code products: ${JSON.stringify(pagination)}, user: ${user.username} (${user.id})`);
    const { page, limit } = pagination;
    const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
    const where = isAdmin ? {} : { deletedAt: null };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.productCode.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where,
        select: summary ? PRODUCT_CODE_SELECT_LIST_SUMMARY : PRODUCT_CODE_SELECT_LIST,
        orderBy: { createdAt: Prisma.SortOrder.desc },
      }),
      this.prisma.product.count({ where }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return { meta: { total, page, lastPage }, data };
  }

  async findByCode(code: number, user: CurrentUser) {
    this.logger.log(`Fetching product by code: ${code}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
      const where = isAdmin ? { code } : { code, deletedAt: null };

      const productCode = await this.prisma.productCode.findFirst({ where, select: PRODUCT_CODE_SELECT_SINGLE });

      if (!productCode)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Product code with code ${code} not found`,
        });

      return productCode;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async findOne(id: string, user: CurrentUser) {
    this.logger.log(`Fetching product by id: ${id}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
      const where = isAdmin ? { id } : { id, deletedAt: null };

      const productCode = await this.prisma.productCode.findFirst({ where, select: PRODUCT_CODE_SELECT_SINGLE });

      if (!productCode)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Product code with id ${id} not found`,
        });

      return productCode;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async remove(id: string, user: CurrentUser) {
    this.logger.log(`Deleting product code: ${id}, user: ${user.username} (${user.id})`);
    try {
      await this.findOne(id, user);

      const deletedCode = await this.prisma.productCode.update({
        where: { id },
        select: PRODUCT_CODE_SELECT_SINGLE,
        data: {
          deletedAt: new Date(),
          deletedBy: { connect: { id: user.id } },
          updatedBy: { connect: { id: user.id } },
        },
      });

      if (deletedCode.deletedAt === null)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Product code with id ${id} cannot be deleted`,
        });

      await this.clearCache();

      return deletedCode;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async restore(id: string, user: CurrentUser) {
    this.logger.log(`Restoring product code: ${id}, user: ${user.username} (${user.id})`);

    try {
      await this.findOne(id, user);

      const restoredCode = await this.prisma.productCode.update({
        where: { id },
        select: PRODUCT_CODE_SELECT_SINGLE,
        data: { deletedAt: null, deletedBy: { disconnect: true }, updatedBy: { connect: { id: user.id } } },
      });

      if (restoredCode.deletedAt === null)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Product code with id ${id} cannot be restored`,
        });

      await this.clearCache();

      return restoredCode;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async clearCache() {
    this.logger.log('Clearing customer cache');
    const keys = await this.cacheManager.store.keys('product_code:*');
    if (keys.length > 0) await this.cacheManager.store.mdel(...keys);
  }
}
