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
  private readonly logger = new Logger(AuthService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Authenticates a user with the provided credentials and returns an authentication response.
   *
   * @param loginDto - The Data Transfer Object containing login credentials (username and password)
   * @returns Promise<AuthResponse> - A promise that resolves to an authentication response containing:
   *                                 - user: The authenticated user object (excluding password and userRoles)
   *                                 - token: A signed JWT token
   *
   * @throws UnauthorizedException
   *         - When username is not found
   *         - When password doesn't match
   *
   * @remarks
   * The method performs the following steps:
   * 1. Finds user by username
   * 2. Validates password using bcrypt
   * 3. Extracts roles from userRoles
   * 4. Removes sensitive data (password, userRoles)
   * 5. Generates JWT token
   *
   * All errors are handled by the exception handler (this.exHandler.process)
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    try {
      this.logger.log(`Authenticating user with username: ${loginDto.username}`);
      const { username, password } = loginDto;

      const user = await this.prisma.user.findFirst({ where: { username }, select: USER_SELECT_SINGLE_PWD });

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

  /**
   * Verifies and refreshes a JWT token, returning user information and a new token
   *
   * @param token - The JWT token string to verify
   * @throws {UnauthorizedException} If token is invalid or user not found
   * @returns {Promise<AuthResponse>} Object containing user data and refreshed token
   *
   * The verification process:
   * 1. Decodes and validates the JWT token
   * 2. Extracts user ID from payload
   * 3. Retrieves user from database
   * 4. Generates new token
   * 5. Returns cleaned user object with roles and new token
   */
  async verifyToken(token: string): Promise<AuthResponse> {
    try {
      this.logger.log('Verifying token');

      const payload = this.jwtService.verify<SignedToken>(token, { secret: envs.jwtSecret });

      const { id } = ObjectManipulator.exclude(payload, ['exp', 'iat']);

      const user = await this.prisma.user.findFirst({
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

  /**
   * Generates a JWT (JSON Web Token) with the provided payload and expiration time.
   *
   * @param payload - The data to be encoded in the JWT
   * @param expiresIn - Token expiration time. Can be a number of seconds or a string describing a time span.
   *                    Eg: '2 days', '10h', '7d', '20s'. Default is '4h'.
   * @returns A signed JWT string
   * @private
   */
  private signToken(payload: JwtPayload, expiresIn: string | number = '4h'): string {
    return this.jwtService.sign(payload, { expiresIn });
  }
}
