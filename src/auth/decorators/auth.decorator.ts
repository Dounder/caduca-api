import { applyDecorators, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';

import { AuthGuard } from '../guards';
import { UserRoleGuard } from '../guards/user-role.guard';
import { Roles } from './role.decorator';

export function Auth(...roles: Role[]) {
  return applyDecorators(Roles(...roles), UseGuards(AuthGuard, UserRoleGuard));
}
