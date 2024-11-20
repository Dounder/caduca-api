import { Module } from '@nestjs/common';
import { VoucherItemService } from './voucher-item.service';
import { VoucherItemController } from './voucher-item.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth';

@Module({
  controllers: [VoucherItemController],
  providers: [VoucherItemService],
  imports: [PrismaModule, AuthModule],
})
export class VoucherItemModule {}
