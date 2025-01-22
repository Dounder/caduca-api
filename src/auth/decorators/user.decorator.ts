import { ExecutionContext, InternalServerErrorException, createParamDecorator } from '@nestjs/common';

/**
 * Custom parameter decorator that extracts the user object from the request.
 *
 * @param data - Unused parameter required by the `createParamDecorator` function
 * @param ctx - The execution context containing the request
 * @throws {InternalServerErrorException} If user object is not found in request (AuthGuard may not be used)
 * @returns The user object from the request
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@GetUser() user: User) {
 *   return user;
 * }
 * ```
 */
export const GetUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();

  if (!request.user) throw new InternalServerErrorException('User not found in request (AuthGuard is used?)');

  return request.user;
});
