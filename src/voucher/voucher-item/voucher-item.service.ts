import { Injectable, Logger } from '@nestjs/common';

import { ExceptionHandler } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVoucherItemDto, UpdateVoucherItemDto } from './dto';
import { CurrentUser } from 'src/user';
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

  findAll() {
    return `This action returns all voucherItem`;
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
