import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from 'src/redis/redis.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [RedisModule, AuthModule, PrismaModule],
})
export class UserModule {}
