import { Injectable, Logger } from '@nestjs/common';

import { Voucher } from '@prisma/client';
import { ExceptionHandler, ObjectManipulator } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrentUser } from 'src/user';
import { CreateVoucherDto } from './dto';
import { VoucherStatus } from './interfaces';

const EXCLUDE_FIELDS: (keyof Voucher)[] = [
  'createdById',
  'updatedById',
  'deletedById',
  'returnTypeId',
  'statusId',
  'customerId',
];
const INCLUDE_LIST = {
  createdBy: { select: { id: true, username: true, email: true } },
  customer: { select: { id: true, name: true } },
  status: { select: { id: true, name: true } },
  returnType: { select: { id: true, name: true } },
};
const INCLUDE_SINGLE = {
  ...INCLUDE_LIST,
  updatedBy: { select: { id: true, username: true, email: true } },
  deletedBy: { select: { id: true, username: true, email: true } },
};

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
        include: INCLUDE_SINGLE,
      });

      return this.excludeFields(voucher);
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  findAll() {
    return `This action returns all voucher`;
  }

  findOne(id: string) {
    return `This action returns a #${id} voucher`;
  }

  updateStatus(id: string, status: VoucherStatus) {
    return `This action update the status of a #${id} voucher with status ${status}`;
  }

  remove(id: string) {
    return `This action removes a #${id} voucher`;
  }

  restore(id: string) {
    return `This action restores a #${id} voucher`;
  }

  private excludeFields(item: Voucher): Partial<Voucher> {
    return ObjectManipulator.exclude<Voucher>(item, EXCLUDE_FIELDS);
  }
}
