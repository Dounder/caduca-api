import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { Auth, GetUser } from 'src/auth';
import { ParseCuidPipe } from 'src/common';
import { CurrentUser, Role } from 'src/user';
import { CreateVoucherDto } from './dto';
import { VoucherStatus } from './interfaces';
import { VoucherService } from './voucher.service';

@Controller('voucher')
@Auth(Role.Admin, Role.Manager, Role.Developer)
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post()
  create(@Body() createVoucherDto: CreateVoucherDto, @GetUser() user: CurrentUser) {
    return this.voucherService.create(createVoucherDto, user);
  }

  @Get()
  findAll() {
    return this.voucherService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseCuidPipe) id: string) {
    return this.voucherService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseCuidPipe) id: string, @Query('status') status: VoucherStatus) {
    return this.voucherService.updateStatus(id, status);
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
