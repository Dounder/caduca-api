import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';

/**
 * Guard that handles authentication by validating JWT tokens from request headers.
 * Implements NestJS's CanActivate interface to protect routes.
 *
 * @class
 * @implements {CanActivate}
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  /**
   * Validates the authentication token from the request and sets user data in the request object.
   *
   * @method canActivate
   * @param {ExecutionContext} context - The execution context from NestJS containing the request
   * @returns {Promise<boolean>} Returns true if authentication is successful
   * @throws {UnauthorizedException} If token is missing or invalid
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) throw new UnauthorizedException();

    try {
      const { user, token: newToken } = await this.authService.verifyToken(token);

      request['user'] = user;

      request['token'] = newToken;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  /**
   * Extracts the Bearer token from the Authorization header.
   *
   * @method extractTokenFromHeader
   * @private
   * @param {Request} request - The incoming HTTP request
   * @returns {string | undefined} The extracted token or undefined if not found/invalid
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
