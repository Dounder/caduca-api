import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';

import { Auth, GetUser } from 'src/auth';
import { PaginationDto, ParseCuidPipe } from 'src/common';
import { CurrentUser, RoleId } from 'src/user';
import { CreateVoucherDto, UpdateVoucherDto } from './dto';
import { VoucherService } from './voucher.service';

@Controller('voucher')
@Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer)
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post()
  create(@Body() createVoucherDto: CreateVoucherDto, @GetUser() user: CurrentUser) {
    return this.voucherService.create(createVoucherDto, user);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto, @GetUser() user: CurrentUser) {
    return this.voucherService.findAll(pagination, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.voucherService.findOne(id, user);
  }

  @Get('number/:number')
  findOneByNumber(@Param('number', ParseIntPipe) number: number, @GetUser() user: CurrentUser) {
    return this.voucherService.findOneByNumber(number, user);
  }

  @Patch(':id')
  updateStatus(
    @Param('id', ParseCuidPipe) id: string,
    @Body() updateDto: UpdateVoucherDto,
    @GetUser() user: CurrentUser,
  ) {
    console.log({ id, updateDto, user });
    return this.voucherService.update(id, updateDto, user);
  }

  @Delete(':id')
  remove(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.voucherService.remove(id, user);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.voucherService.restore(id, user);
  }
}
