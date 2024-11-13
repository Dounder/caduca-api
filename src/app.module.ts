import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CustomerModule } from './customer/customer.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductCodeModule } from './product/product-code/product-code.module';
import { ProductModule } from './product/product.module';
import { UserModule } from './user/user.module';
import { SalespersonModule } from './salesperson/salesperson.module';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, ProductModule, ProductCodeModule, CustomerModule, SalespersonModule],
  providers: [],
})
export class AppModule {}
