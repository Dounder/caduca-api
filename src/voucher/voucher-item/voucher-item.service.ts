import { Injectable } from '@nestjs/common';
import { CreateVoucherItemDto } from './dto/create-voucher-item.dto';
import { UpdateVoucherItemDto } from './dto/update-voucher-item.dto';

@Injectable()
export class VoucherItemService {
  create(createVoucherItemDto: CreateVoucherItemDto) {
    return 'This action adds a new voucherItem';
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
