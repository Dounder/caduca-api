import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { envs } from 'src/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from 'src/redis/redis.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    PrismaModule,
    JwtModule.register({
      global: true,
      secret: envs.jwtSecret,
      signOptions: { expiresIn: '4h' },
    }),
    RedisModule,
  ],
  exports: [AuthService],
})
export class AuthModule {}
