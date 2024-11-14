import { Injectable, Logger } from '@nestjs/common';
import { ExceptionHandler } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVoucherDto, UpdateVoucherDto } from './dto';

@Injectable()
export class VoucherService {
  private readonly logger = new Logger(VoucherService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, VoucherService.name);

  constructor(private readonly prisma: PrismaService) {}

  create(createVoucherDto: CreateVoucherDto) {
    return 'This action adds a new voucher';
  }

  findAll() {
    return `This action returns all voucher`;
  }

  findOne(id: string) {
    return `This action returns a #${id} voucher`;
  }

  update(id: string, updateVoucherDto: UpdateVoucherDto) {
    return `This action updates a #${id} voucher`;
  }

  remove(id: string) {
    return `This action removes a #${id} voucher`;
  }

  restore(id: string) {
    return `This action restores a #${id} voucher`;
  }
}
