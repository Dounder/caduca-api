import { applyDecorators, UseGuards } from '@nestjs/common';

import { RoleId } from 'src/user';
import { AuthGuard } from '../guards';
import { UserRoleGuard } from '../guards/user-role.guard';
import { Roles } from './role.decorator';

/**
 * Custom decorator that combines authentication and role-based authorization.
 * This decorator applies both authentication guard and role-based authorization guard.
 *
 * @param roles - An array of RoleId values representing the roles allowed to access the decorated route
 * @returns A decorator composition of Roles and Guards for authentication and role verification
 *
 * @example
 * ```typescript
 * @Auth(RoleId.ADMIN)
 * async adminRoute() {
 *   // Only authenticated users with ADMIN role can access this
 * }
 * ```
 */
export function Auth(...roles: RoleId[]) {
  return applyDecorators(Roles(...roles), UseGuards(AuthGuard, UserRoleGuard));
}
