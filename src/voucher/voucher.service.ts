import { ConflictException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PaginationDto } from 'src/common';
import { ExceptionHandler, hasRoles } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrentUser, Role } from 'src/user';
import { CreateVoucherDto } from './dto';
import { VOUCHER_SELECT_LIST, VOUCHER_SELECT_SINGLE } from './helpers';
import { VoucherStatus } from './interfaces';

@Injectable()
export class VoucherService {
  private readonly logger = new Logger(VoucherService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, VoucherService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createVoucherDto: CreateVoucherDto, user: CurrentUser) {
    const message = `Creating voucher: ${JSON.stringify(createVoucherDto)}, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      const voucher = await this.prisma.voucher.create({
        data: {
          ...createVoucherDto,
          createdById: user.id,
          logs: { create: { message, createdBy: { connect: { id: user.id } } } },
        },
        select: VOUCHER_SELECT_SINGLE,
      });

      return voucher;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async findAll(pagination: PaginationDto, user: CurrentUser) {
    const { page, limit } = pagination;
    const isAdmin = hasRoles(user.roles, [Role.Admin]);
    const where = isAdmin ? {} : { deletedAt: null };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.voucher.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where,
        select: VOUCHER_SELECT_LIST,
      }),
      this.prisma.voucher.count({ where }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return { meta: { total, page, lastPage }, data };
  }

  async findOne(id: string, user: CurrentUser) {
    this.logger.log(`Fetching voucher: ${id}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [Role.Admin]);
      const where = isAdmin ? { id } : { id, deletedAt: null };

      const voucher = await this.prisma.voucher.findFirst({
        where,
        select: VOUCHER_SELECT_SINGLE,
      });

      if (!voucher)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Voucher with id ${id} not found`,
        });

      return voucher;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  updateStatus(id: string, status: VoucherStatus) {
    return `This action update the status of a #${id} voucher with status ${status}`;
  }

  async remove(id: string, user: CurrentUser) {
    const message = `Deleting voucher: ${id}, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      const voucher = await this.findOne(id, user);

      if (voucher.deletedAt) {
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Voucher with id ${id} cannot be deleted`,
        });
      }

      return await this.prisma.voucher.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: { connect: { id: user.id } },
          logs: { create: { message, createdBy: { connect: { id: user.id } } } },
        },
        select: VOUCHER_SELECT_SINGLE,
      });
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async restore(id: string, user: CurrentUser) {
    const message = `Restoring voucher: ${id}, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      const voucher = await this.findOne(id, user);

      if (!voucher.deletedAt) {
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Voucher with id ${id} cannot be restored`,
        });
      }

      return await this.prisma.voucher.update({
        where: { id },
        data: {
          deletedAt: null,
          deletedBy: { disconnect: { id: user.id } },
          logs: { create: { message, createdBy: { connect: { id: user.id } } } },
        },
        select: VOUCHER_SELECT_SINGLE,
      });
    } catch (error) {
      this.exHandler.process(error);
    }
  }
}
