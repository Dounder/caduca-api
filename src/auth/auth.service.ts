import { HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { envs } from 'src/config';
import { ExceptionHandler, ObjectManipulator } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto';
import { AuthResponse, JwtPayload, SignedToken } from './interfaces';
import { USER_SELECT_SINGLE_PWD } from 'src/user';

@Injectable()
export class AuthService {
  private readonly user = this.prismaService.user;
  private readonly logger = new Logger(AuthService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    try {
      this.logger.log(`Authenticating user with username: ${loginDto.username}`);
      const { username, password } = loginDto;

      const user = await this.user.findFirst({ where: { username }, select: USER_SELECT_SINGLE_PWD });

      if (!user)
        throw new UnauthorizedException({ status: HttpStatus.UNAUTHORIZED, message: '[ERROR] Invalid credentials' });

      const isValidPassword = bcrypt.compareSync(password, user.password);

      if (!isValidPassword)
        throw new UnauthorizedException({ status: HttpStatus.UNAUTHORIZED, message: '[ERROR] Invalid credentials' });

      const roles = user.userRoles.map((role) => role.role);
      const cleanUser = ObjectManipulator.exclude(user, ['password', 'userRoles']);

      return { user: { ...cleanUser, roles }, token: this.signToken({ id: user.id }) };
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  async verifyToken(token: string): Promise<AuthResponse> {
    try {
      this.logger.log('Verifying token');

      const payload = this.jwtService.verify<SignedToken>(token, { secret: envs.jwtSecret });

      const { id } = ObjectManipulator.exclude(payload, ['exp', 'iat']);

      const user = await this.user.findFirst({
        where: { id },
        select: USER_SELECT_SINGLE_PWD,
      });

      if (!user) throw new UnauthorizedException({ status: HttpStatus.UNAUTHORIZED, message: 'Invalid token' });

      const tokenSigned = this.signToken({ id: user.id });
      const roles = user.userRoles.map((role) => role.role);
      const cleanUser = ObjectManipulator.exclude(user, ['password', 'userRoles']);

      return { user: { ...cleanUser, roles }, token: tokenSigned };
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  private signToken(payload: JwtPayload, expiresIn: string | number = '4h'): string {
    return this.jwtService.sign(payload, { expiresIn });
  }
}
