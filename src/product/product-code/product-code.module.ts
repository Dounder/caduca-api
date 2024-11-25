import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProductCodeController } from './product-code.controller';
import { ProductCodeService } from './product-code.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  controllers: [ProductCodeController],
  providers: [ProductCodeService],
  imports: [PrismaModule, RedisModule, AuthModule],
})
export class ProductCodeModule {}
