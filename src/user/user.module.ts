import { Module } from '@nestjs/common';
import { AuthModule, AuthService } from 'src/auth';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisModule } from 'src/redis/redis.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, AuthService],
  imports: [RedisModule, AuthModule],
})
export class UserModule {}
