import { Injectable, Logger } from '@nestjs/common';

import { ExceptionHandler } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrentUser } from 'src/user';
import { CreateProductDto, UpdateProductDto } from './dto';
import { PaginationDto } from 'src/common';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, ProductService.name);

  constructor(private readonly prisma: PrismaService) {}

  create(createProductDto: CreateProductDto, user: CurrentUser) {
    return 'This action adds a new product';
  }

  findAll(pagination: PaginationDto, user: CurrentUser) {
    return `This action returns all product`;
  }

  findOne(id: string, user: CurrentUser) {
    return `This action returns a #${id} product`;
  }

  findByCode(code: number, user: CurrentUser) {
    return `This action returns a product with code #${code}`;
  }

  update(id: string, updateProductDto: UpdateProductDto, user: CurrentUser) {
    return `This action updates a #${id} product`;
  }

  remove(id: string, user: CurrentUser) {
    return `This action removes a #${id} product`;
  }

  restore(id: string, user: CurrentUser) {
    return `This action restores a #${id} product`;
  }
}
