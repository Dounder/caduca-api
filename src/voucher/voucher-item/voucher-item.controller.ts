import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VoucherItemService } from './voucher-item.service';
import { CreateVoucherItemDto } from './dto/create-voucher-item.dto';
import { UpdateVoucherItemDto } from './dto/update-voucher-item.dto';

@Controller('voucher/item')
export class VoucherItemController {
  constructor(private readonly voucherItemService: VoucherItemService) {}

  @Post()
  create(@Body() createVoucherItemDto: CreateVoucherItemDto) {
    return this.voucherItemService.create(createVoucherItemDto);
  }

  @Get()
  findAll() {
    return this.voucherItemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.voucherItemService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVoucherItemDto: UpdateVoucherItemDto) {
    return this.voucherItemService.update(+id, updateVoucherItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.voucherItemService.remove(+id);
  }
}
