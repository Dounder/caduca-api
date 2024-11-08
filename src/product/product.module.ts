import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from 'src/redis/redis.module';
import { AuthModule } from 'src/auth';

@Module({
  controllers: [ProductController],
  providers: [ProductService],
  imports: [PrismaModule, RedisModule, AuthModule],
})
export class ProductModule {}
