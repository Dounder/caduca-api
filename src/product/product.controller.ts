import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './dto';
import { Auth, GetUser } from 'src/auth';
import { CurrentUser, RoleId } from 'src/user';
import { PaginationDto, ParseCuidPipe } from 'src/common';

@Controller('product')
@Auth()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer)
  create(@Body() createProductDto: CreateProductDto, @GetUser() user: CurrentUser) {
    return this.productService.create(createProductDto, user);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto, @GetUser() user: CurrentUser) {
    return this.productService.findAll(pagination, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.productService.findOne(id, user);
  }

  @Patch(':id')
  @Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer)
  update(
    @Param('id', ParseCuidPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUser() user: CurrentUser,
  ) {
    return this.productService.update(id, updateProductDto, user);
  }

  @Delete(':id')
  @Auth(RoleId.Admin, RoleId.Developer)
  remove(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.productService.remove(id, user);
  }

  @Patch(':id/restore')
  @Auth(RoleId.Admin, RoleId.Developer)
  restore(@Param('id', ParseCuidPipe) id: string, @GetUser() user: CurrentUser) {
    return this.productService.restore(id, user);
  }
}
