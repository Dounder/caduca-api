import { Injectable, Logger } from '@nestjs/common';

import { PaginationDto } from 'src/common';
import { ExceptionHandler, hasRoles } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrentUser, Role } from 'src/user';
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
    const isAdmin = hasRoles(user.roles, [Role.Admin]);
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

  findOne(id: number) {
    return `This action returns a #${id} voucherItem`;
  }

  update(id: number, updateVoucherItemDto: UpdateVoucherItemDto) {
    return `This action updates a #${id} voucherItem`;
  }

  remove(id: number) {
    return `This action removes a #${id} voucherItem`;
  }
}
