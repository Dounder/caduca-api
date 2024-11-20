import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VoucherController } from './voucher.controller';
import { VoucherService } from './voucher.service';
import { VoucherItemModule } from './voucher-item/voucher-item.module';

@Module({
  controllers: [VoucherController],
  providers: [VoucherService],
  imports: [PrismaModule, AuthModule, VoucherItemModule],
})
export class VoucherModule {}
