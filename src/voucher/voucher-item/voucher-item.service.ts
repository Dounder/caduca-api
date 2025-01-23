import { BadRequestException, HttpStatus, Injectable, Logger } from '@nestjs/common';

import { PaginationDto } from 'src/common';
import { ExceptionHandler, hasRoles } from 'src/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrentUser, RoleId } from 'src/user';
import { CreateVoucherItemDto, UpdateVoucherItemDto } from './dto';
import { VOUCHER_ITEM_SINGLE } from './helpers';

@Injectable()
export class VoucherItemService {
  private readonly logger = new Logger(VoucherItemService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, VoucherItemService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createVoucherItemDto: CreateVoucherItemDto, user: CurrentUser) {
    const message = `Creating voucher item: ${JSON.stringify(createVoucherItemDto)}, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      const [voucherItem] = await this.prisma.$transaction([
        this.prisma.voucherItem.create({
          data: {
            ...createVoucherItemDto,
            createdById: user.id,
          },
          select: VOUCHER_ITEM_SINGLE,
        }),
        this.prisma.voucherLog.create({
          data: {
            voucherId: createVoucherItemDto.voucherId,
            message,
            createdById: user.id,
          },
        }),
      ]);

      return voucherItem;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async findAll(pagination: PaginationDto, user: CurrentUser) {
    const { page, limit } = pagination;
    const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
    const where = isAdmin ? {} : { deletedAt: null };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.voucherItem.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where,
        select: VOUCHER_ITEM_SINGLE,
      }),
      this.prisma.voucherItem.count({ where }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return { meta: { total, page, lastPage }, data };
  }

  async update(updateVoucherItemDto: UpdateVoucherItemDto, user: CurrentUser) {
    try {
      const { voucherId, items } = updateVoucherItemDto;

      if (!items || items.length === 0)
        throw new BadRequestException({ status: HttpStatus.BAD_REQUEST, message: 'Items are required' });

      const message = `Updating ${items.length} voucher items for voucher ${voucherId}, user: ${user.username} (${user.id})`;
      this.logger.log(message, { details: items });

      const itemUpdates = items.map((item) => ({
        where: { id: item.id },
        data: { ...item, updatedById: user.id, deletedById: item.deletedAt ? user.id : null },
        select: VOUCHER_ITEM_SINGLE,
      }));

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
