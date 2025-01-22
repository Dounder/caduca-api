import { ExecutionContext, InternalServerErrorException, createParamDecorator } from '@nestjs/common';

/**
 * Custom parameter decorator that extracts the token from the request object.
 * This decorator should be used in conjunction with AuthGuard to ensure token availability.
 *
 * @param data - Unused parameter required by the createParamDecorator interface
 * @param ctx - The execution context containing the request object
 * @throws {InternalServerErrorException} If token is not found in request (AuthGuard might not be applied)
 * @returns The token value from the request object
 *
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(AuthGuard)
 * async getProfile(@Token() token: string) {
 *   // Use token here
 * }
 * ```
 */
export const Token = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();

  if (!request.token) throw new InternalServerErrorException('Token not found (AuthGuard is used?)');

  return request.token;
});
