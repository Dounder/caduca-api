import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VoucherItemService } from './voucher-item.service';
import { CreateVoucherItemDto, UpdateVoucherItemDto } from './dto';
import { Auth, GetUser } from 'src/auth';
import { CurrentUser } from 'src/user';

@Controller('voucher/item')
@Auth()
export class VoucherItemController {
  constructor(private readonly voucherItemService: VoucherItemService) {}

  @Post()
  create(@Body() createVoucherItemDto: CreateVoucherItemDto, @GetUser() user: CurrentUser) {
    return this.voucherItemService.create(createVoucherItemDto, user);
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
