import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from 'src/redis/redis.module';
import { SalespersonController } from './salesperson.controller';
import { SalespersonService } from './salesperson.service';

@Module({
  controllers: [SalespersonController],
  providers: [SalespersonService],
  imports: [PrismaModule, RedisModule, AuthModule],
})
export class SalespersonModule {}
