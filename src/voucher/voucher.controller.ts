import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { CreateVoucherDto, UpdateVoucherDto } from './dto';
import { ParseCuidPipe } from 'src/common';

@Controller('voucher')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post()
  create(@Body() createVoucherDto: CreateVoucherDto) {
    return this.voucherService.create(createVoucherDto);
  }

  @Get()
  findAll() {
    return this.voucherService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseCuidPipe) id: string) {
    return this.voucherService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseCuidPipe) id: string, @Body() updateVoucherDto: UpdateVoucherDto) {
    return this.voucherService.update(id, updateVoucherDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseCuidPipe) id: string) {
    return this.voucherService.remove(id);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseCuidPipe) id: string) {
    return this.voucherService.restore(id);
  }
}
