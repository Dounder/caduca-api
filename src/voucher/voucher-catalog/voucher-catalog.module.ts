import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from 'src/redis/redis.module';
import { VoucherCatalogController } from './voucher-catalog.controller';
import { VoucherCatalogService } from './voucher-catalog.service';

@Module({
  controllers: [VoucherCatalogController],
  providers: [VoucherCatalogService],
  imports: [PrismaModule, RedisModule],
})
export class VoucherCatalogModule {}
