import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ReportController],
  providers: [ReportService],
  imports: [PrismaModule, AuthModule],
})
export class ReportModule {}
