import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VoucherController } from './voucher.controller';
import { VoucherService } from './voucher.service';

@Module({
  controllers: [VoucherController],
  providers: [VoucherService],
  imports: [PrismaModule, AuthModule],
})
export class VoucherModule {}
