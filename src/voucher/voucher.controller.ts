import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';

import { Auth, GetUser } from 'src/auth';
import { PaginationDto, ParseCuidPipe } from 'src/common';
import { User, RoleId } from 'src/user';
import { CreateVoucherDto, UpdateVoucherDto } from './dto';
import { VoucherService } from './voucher.service';

@Controller('voucher')
@Auth()
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post()
  @Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer, RoleId.Salesperson)
  create(@Body() createVoucherDto: CreateVoucherDto, @GetUser() user: User) {
    return this.voucherService.create(createVoucherDto, user);
  }

  @Get()
  @Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer, RoleId.Warehouse, RoleId.Salesperson)
  findAll(@Query() pagination: PaginationDto, @GetUser() user: User) {
    return this.voucherService.findAll(pagination, user);
  }

  @Get(':id')
  @Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer, RoleId.Warehouse, RoleId.Salesperson)
  findOne(@Param('id', ParseCuidPipe) id: string, @GetUser() user: User) {
    return this.voucherService.findOne(id, user);
  }

  @Get('number/:number')
  @Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer, RoleId.Warehouse, RoleId.Salesperson)
  findOneByNumber(@Param('number', ParseIntPipe) number: number, @GetUser() user: User) {
    return this.voucherService.findOneByNumber(number, user);
  }

  @Patch(':id')
  @Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer, RoleId.Warehouse, RoleId.Salesperson)
  updateStatus(@Param('id', ParseCuidPipe) id: string, @Body() updateDto: UpdateVoucherDto, @GetUser() user: User) {
    console.log({ id, updateDto, user });
    return this.voucherService.update(id, updateDto, user);
  }

  @Delete(':id')
  @Auth(RoleId.Admin, RoleId.Developer)
  remove(@Param('id', ParseCuidPipe) id: string, @GetUser() user: User) {
    return this.voucherService.remove(id, user);
  }

  @Patch(':id/restore')
  @Auth(RoleId.Admin, RoleId.Developer)
  restore(@Param('id', ParseCuidPipe) id: string, @GetUser() user: User) {
    return this.voucherService.restore(id, user);
  }
}
