import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { ProductCodeModule } from './product/product-code/product-code.module';
import { ClientModule } from './client/client.module';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, ProductModule, ProductCodeModule, ClientModule],
  providers: [],
})
export class AppModule {}
