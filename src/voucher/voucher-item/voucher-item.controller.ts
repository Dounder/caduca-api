import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { Auth, GetUser } from 'src/auth';
import { PaginationDto, ParseCuidPipe } from 'src/common';
import { CurrentUser } from 'src/user';
import { CreateVoucherItemDto, UpdateVoucherItemDto } from './dto';
import { VoucherItemService } from './voucher-item.service';

@Controller('voucher/item')
@Auth()
export class VoucherItemController {
  constructor(private readonly voucherItemService: VoucherItemService) {}

  @Post()
  create(@Body() createVoucherItemDto: CreateVoucherItemDto, @GetUser() user: CurrentUser) {
    return this.voucherItemService.create(createVoucherItemDto, user);
  }

  @Get(':voucherId')
  findAll(@Query() pagination: PaginationDto, @GetUser() user: CurrentUser) {
    return this.voucherItemService.findAll(pagination, user);
  }

  @Patch()
  update(@Body() updateVoucherItemDto: UpdateVoucherItemDto, @GetUser() user: CurrentUser) {
    return this.voucherItemService.update(updateVoucherItemDto, user);
  }
}
