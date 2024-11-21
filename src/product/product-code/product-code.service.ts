import { ConflictException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProductCode } from '@prisma/client';

import { ExceptionHandler, hasRoles, ObjectManipulator } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrentUser, Role } from 'src/user';
import { CreateProductCodeDto } from './dto';

const EXCLUDE_FIELDS: (keyof ProductCode)[] = ['createdById', 'updatedById', 'deletedById', 'productId'];
const INCLUDE_FIELDS = {
  product: {
    select: {
      id: true,
      name: true,
      createdAt: true,
      createdBy: { select: { id: true, username: true, email: true } },
    },
  },
  createdBy: { select: { id: true, username: true, email: true } },
  updatedBy: { select: { id: true, username: true, email: true } },
  deletedBy: { select: { id: true, username: true, email: true } },
};

@Injectable()
export class ProductCodeService {
  private readonly logger = new Logger(ProductCodeService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, ProductCodeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createProductCodeDto: CreateProductCodeDto, user: CurrentUser) {
    this.logger.log(
      `Creating product code: ${JSON.stringify(createProductCodeDto)}, user: ${user.username} (${user.id})`,
    );
    try {
      const newCode = await this.prisma.productCode.create({
        data: { createdBy: { connect: { id: user.id } }, product: { connect: { id: createProductCodeDto.productId } } },
        include: INCLUDE_FIELDS,
      });

      return this.excludeFields(newCode);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async findByCode(code: number, user: CurrentUser) {
    this.logger.log(`Fetching product by code: ${code}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [Role.Admin]);
      const where = isAdmin ? { code } : { code, deletedAt: null };

      const productCode = await this.prisma.productCode.findFirst({ where, include: INCLUDE_FIELDS });

      return this.excludeFields(productCode);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async findOne(id: string, user: CurrentUser) {
    this.logger.log(`Fetching product by id: ${id}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [Role.Admin]);
      const where = isAdmin ? { id } : { id, deletedAt: null };

      const productCode = await this.prisma.productCode.findFirst({ where, include: INCLUDE_FIELDS });

      if (!productCode)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Product code with id ${id} not found`,
        });

      return this.excludeFields(productCode);
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
        include: INCLUDE_FIELDS,
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

      return this.excludeFields(deletedCode);
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
        include: INCLUDE_FIELDS,
        data: { deletedAt: null, deletedBy: { disconnect: true }, updatedBy: { connect: { id: user.id } } },
      });

      if (restoredCode.deletedAt === null)
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Product code with id ${id} cannot be restored`,
        });

      return this.excludeFields(restoredCode);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  private excludeFields(data: ProductCode) {
    return ObjectManipulator.exclude<ProductCode>(data, EXCLUDE_FIELDS);
  }
}
