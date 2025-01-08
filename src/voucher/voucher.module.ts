import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VoucherController } from './voucher.controller';
import { VoucherService } from './voucher.service';
import { VoucherItemModule } from './voucher-item/voucher-item.module';
import { VoucherCatalogModule } from './voucher-catalog/voucher-catalog.module';

@Module({
  controllers: [VoucherController],
  providers: [VoucherService],
  imports: [PrismaModule, AuthModule, VoucherItemModule, VoucherCatalogModule],
})
export class VoucherModule {}
