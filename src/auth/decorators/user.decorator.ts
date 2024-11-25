import { ExecutionContext, InternalServerErrorException, createParamDecorator } from '@nestjs/common';

export const GetUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();

  if (!request.user) throw new InternalServerErrorException('User not found in request (AuthGuard is used?)');

  return request.user;
});
