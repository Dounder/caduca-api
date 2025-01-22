import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Auth, Token } from './decorators';
import { LoginDto } from './dto';

/**
 * Controller responsible for handling authentication-related endpoints.
 * Provides functionality for user login, token verification, and service health checks.
 *
 * @class AuthController
 * @implements {Controller}
 *
 * @property {AuthService} authService - The authentication service instance
 *
 * @example
 * ```typescript
 * // Login example
 * POST /auth/login
 * {
 *   "username": "user@example.com",
 *   "password": "password123"
 * }
 *
 * // Verify token example
 * POST /auth/verify
 * Authorization: Bearer <jwt_token>
 * ```
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  /**
   * Performs a health check on the authentication service.
   * @returns {string} A message indicating that the authentication service is operational
   */
  healthCheck() {
    return 'Auth service is up and running';
  }

  @Post('login')
  /**
   * Authenticates a user with their credentials.
   *
   * @param loginDto - The data transfer object containing user login credentials
   * @returns A promise that resolves to the authentication token and user information
   * @throws UnauthorizedException - If the credentials are invalid
   */
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('verify')
  @Auth()
  /**
   * Verifies the authenticity and validity of the provided JWT token
   * @param token - The JWT token to verify
   * @returns A Promise that resolves to the decoded token payload if valid
   * @throws UnauthorizedException if the token is invalid or expired
   */
  verifyToken(@Token() token: string) {
    return this.authService.verifyToken(token);
  }
}
