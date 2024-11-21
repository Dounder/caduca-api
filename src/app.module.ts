import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CustomerModule } from './customer/customer.module';
import { ProductCodeModule } from './product/product-code/product-code.module';
import { ProductModule } from './product/product.module';
import { SalespersonModule } from './salesperson/salesperson.module';
import { UserModule } from './user/user.module';
import { VoucherModule } from './voucher/voucher.module';

@Module({
  imports: [AuthModule, UserModule, ProductModule, ProductCodeModule, CustomerModule, SalespersonModule, VoucherModule],
  providers: [],
})
export class AppModule {}
