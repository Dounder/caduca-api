import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

import { Auth, GetUser } from 'src/auth';
import { CurrentUser, RoleId } from 'src/user';
import { CreateProductCodeDto } from './dto';
import { ProductCodeService } from './product-code.service';
import { ParseCuidPipe } from 'src/common';

@Controller('product/code')
@Auth()
export class ProductCodeController {
  constructor(private readonly productCodeService: ProductCodeService) {}

  @Post()
  @Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer)
  create(@Body() createProductCodeDto: CreateProductCodeDto, @GetUser() user: CurrentUser) {
    return this.productCodeService.create(createProductCodeDto, user);
  }

  @Get(':code')
  findOne(@Param('code', ParseIntPipe) code: number, @GetUser() user: CurrentUser) {
    return this.productCodeService.findByCode(code, user);
  }

  @Delete(':id')
  @Auth(RoleId.Admin, RoleId.Developer)
  remove(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.productCodeService.remove(id, user);
  }

  @Patch(':id/restore')
  @Auth(RoleId.Admin, RoleId.Developer)
  restore(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.productCodeService.restore(id, user);
  }
}
