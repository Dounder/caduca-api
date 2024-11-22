import { applyDecorators, UseGuards } from '@nestjs/common';

import { RoleId } from 'src/user';
import { AuthGuard } from '../guards';
import { UserRoleGuard } from '../guards/user-role.guard';
import { Roles } from './role.decorator';

export function Auth(...roles: RoleId[]) {
  return applyDecorators(Roles(...roles), UseGuards(AuthGuard, UserRoleGuard));
}
