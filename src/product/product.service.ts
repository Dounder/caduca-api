import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';

import { ExceptionHandler, hasRoles, PaginationDto } from 'src/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrentUser, RoleId } from 'src/user';
import { CreateProductDto, UpdateProductDto } from './dto';
import { PRODUCT_SELECT_LIST, PRODUCT_SELECT_LIST_SUMMARY, PRODUCT_SELECT_SINGLE } from './helper';

interface FindOneProps {
  id: string;
  user: CurrentUser;
  slug?: boolean;
}

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
      const { newCode, ...productData } = createProductDto;

      const product = await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            ...productData,
            slug: await this.generateSlug(productData.name),
            createdBy: { connect: { id: user.id } },
            updatedBy: { connect: { id: user.id } },
          },
          select: PRODUCT_SELECT_SINGLE,
        });

        if (newCode) {
          await tx.productCode.create({
            data: { product: { connect: { id: product.id } }, createdBy: { connect: { id: user.id } } },
          });
        }
        return product;
      });

      await this.clearCache();

      return product;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async findAll(user: CurrentUser, params: PaginationDto) {
    this.logger.log(`Fetching products: ${JSON.stringify(params)}, user: ${user.username} (${user.id})`);
    const { page, limit, summary, search } = params;
    const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
    const where = {
      AND: [
        isAdmin ? {} : { deletedAt: null },
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { codes: { some: { code: { equals: parseInt(search) || undefined } } } },
              ],
            }
          : {},
      ],
    };

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

  async findOne({ id, user, slug }: FindOneProps) {
    this.logger.log(`Fetching product by ${slug ? 'slug' : 'id'}: ${id}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
      const where = isAdmin ? { [slug ? 'slug' : 'id']: id } : { [slug ? 'slug' : 'id']: id, deletedAt: null };

      const product = await this.prisma.product.findFirst({ where, select: PRODUCT_SELECT_SINGLE });

      if (!product)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Product with ${slug ? 'slug' : 'id'} ${id} not found`,
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
      const dbProduct = await this.findOne({ id, user });

      const { name } = updateProductDto;

      if (dbProduct.name === name) return dbProduct;

      const product = await this.prisma.$transaction(async (tx) => {
        const product = await this.prisma.product.update({
          where: { id },
          data: {
            name,
            slug: await this.generateSlug(updateProductDto.name, id),
            updatedBy: { connect: { id: user.id } },
          },
          select: PRODUCT_SELECT_SINGLE,
        });

        return product;
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
      const product = await this.findOne({ id, user });

      if (product.deletedAt !== null)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Product with id ${id} is already deleted`,
        });

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: { connect: { id: user.id } },
        },
        select: PRODUCT_SELECT_SINGLE,
      });

      await this.clearCache();

      return updatedProduct;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async restore(id: string, user: CurrentUser) {
    this.logger.log(`Restoring product: ${id}, user: ${user.username} (${user.id})`);
    try {
      const product = await this.findOne({ id, user });

      if (product.deletedAt === null)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Product with id ${id} is already restored`,
        });

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          deletedAt: null,
          deletedBy: { disconnect: true },
        },
        select: PRODUCT_SELECT_SINGLE,
      });

      await this.clearCache();

      return updatedProduct;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  private async generateSlug(text: string, id?: string) {
    const slug = text
      .normalize('NFD') // Normalize accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with '_'
      .replace(/^_+|_+$/g, ''); // Trim starting and ending '_'

    const existing = await this.prisma.product.findFirst({ where: { slug } });
    if (!existing) return slug;

    // If the base slug exists, append a short unique suffix
    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    return `${slug}_${uniqueSuffix}`;
  }

  async clearCache() {
    this.logger.log('Clearing customer cache');
    const keys = await this.cacheManager.store.keys('product:*');
    if (keys.length > 0) await this.cacheManager.store.mdel(...keys);
  }
}
