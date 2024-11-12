import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProductCodeController } from './product-code.controller';
import { ProductCodeService } from './product-code.service';

@Module({
  controllers: [ProductCodeController],
  providers: [ProductCodeService],
  imports: [PrismaModule, AuthModule],
})
export class ProductCodeModule {}
