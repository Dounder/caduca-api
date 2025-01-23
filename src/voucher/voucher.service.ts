import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PaginationDto } from 'src/common';
import { ExceptionHandler, hasRoles } from 'src/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User, RoleId } from 'src/user';
import { CreateVoucherDto, UpdateVoucherDto, UpdateVoucherItemDto } from './dto';
import { validateVoucherStatusChange, VOUCHER_SELECT_LIST, VOUCHER_SELECT_SINGLE } from './helpers';
import { VoucherResponse, VoucherStatus } from './interfaces';
import { VOUCHER_ITEM_SINGLE } from './voucher-item';

@Injectable()
export class VoucherService {
  private readonly logger = new Logger(VoucherService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, VoucherService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createVoucherDto: CreateVoucherDto, user: User) {
    const { items, ...data } = createVoucherDto;
    const message = `Creating voucher: ${JSON.stringify(data)} with: ${items.length} items, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      const voucher = await this.prisma.voucher.create({
        data: {
          ...data,
          createdById: user.id,
          logs: { create: { message, createdBy: { connect: { id: user.id } } } },
          items: { createMany: { data: items } },
        },
        select: VOUCHER_SELECT_SINGLE,
      });

      return voucher;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async findAll(pagination: PaginationDto, user: User) {
    const { page, limit, search } = pagination;
    const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
    const where = {
      AND: [
        isAdmin ? {} : { deletedAt: null },
        search
          ? {
              OR: [
                { number: { equals: parseInt(search) || undefined } },
                { customer: { name: { contains: search, mode: 'insensitive' as const } } },
              ],
            }
          : {},
      ],
    };

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

  async findOne(id: string, user: User): Promise<VoucherResponse> {
    this.logger.log(`Fetching voucher: ${id}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
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

  async findOneByNumber(number: number, user: User) {
    this.logger.log(`Fetching voucher: #${number}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
      const where = isAdmin ? { number } : { number, deletedAt: null };

      const voucher = await this.prisma.voucher.findFirst({
        where,
        select: VOUCHER_SELECT_SINGLE,
      });

      if (!voucher)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Voucher with number #${number} not found`,
        });

      return voucher;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async update(id: string, updateDto: UpdateVoucherDto, user: User): Promise<VoucherResponse> {
    const { status, items } = updateDto;
    this.logger.log(`Updating voucher: ${id}, user: ${user.username} (${user.id})`);

    try {
      // Retrieve the current voucher
      const voucher = await this.findOne(id, user);
      const oldStatus = voucher.status.id as VoucherStatus;

      // Validate new status
      const isValidChange = validateVoucherStatusChange(oldStatus, status);
      if (!isValidChange) {
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Invalid status change from ${VoucherStatus[oldStatus]} (${oldStatus}) to ${VoucherStatus[status]} (${status})`,
        });
      }

      // Build log message
      const message = `Change status from ${VoucherStatus[oldStatus]} (${oldStatus}) to ${VoucherStatus[status]} (${status}), user: ${user.username} (${user.id})`;

      // Perform updates in a transaction
      const updatedVoucher = await this.prisma.$transaction(async (prisma) => {
        // Update items if they exist
        if (items && items.length > 0) await this.updateItems(voucher.id, items, user);

        // Update the voucher status and add a log entry
        return prisma.voucher.update({
          where: { id },
          data: {
            approvedDate: status === VoucherStatus.Approved ? new Date() : null,
            rejectedDate: status === VoucherStatus.Rejected ? new Date() : null,
            status: { connect: { id: status } },
            logs: { create: { message, createdBy: { connect: { id: user.id } } } },
          },
          select: VOUCHER_SELECT_SINGLE,
        });
      });

      return updatedVoucher;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async remove(id: string, user: User) {
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

  async restore(id: string, user: User) {
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

  async updateItems(voucherId: string, items: UpdateVoucherItemDto[], user: User) {
    if (!items || items.length === 0)
      throw new BadRequestException({ status: HttpStatus.BAD_REQUEST, message: 'Items are required' });

    const message = `Updating ${items.length} voucher items for voucher ${voucherId}, user: ${user.username} (${user.id})`;
    this.logger.log(message, { details: items });

    const itemUpdates = items.map((item) => ({
      where: { id: item.id },
      data: { ...item, updatedById: user.id, deletedById: item.deletedAt ? user.id : null },
      select: VOUCHER_ITEM_SINGLE,
    }));

    try {
      const updatedItems = await this.prisma.$transaction(async (prisma) => {
        const updated = await Promise.all(itemUpdates.map(prisma.voucherItem.update));

        await prisma.voucherLog.create({ data: { voucherId, message, createdById: user.id } });

        return updated;
      });

      return updatedItems;
    } catch (error) {
      this.exHandler.process(error);
    }
  }
}
