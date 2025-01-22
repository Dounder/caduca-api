import { SetMetadata } from '@nestjs/common';
import { RoleId } from 'src/user';

export const META_ROLES_KEY = 'roles';

/**
 * Decorator factory that allows assigning roles to route handlers or controllers.
 *
 * @param roles - An array of role identifiers (RoleId) to be assigned
 * @returns A decorator function that sets metadata for role-based authorization
 *
 * @example
 * ```typescript
 * @Roles(RoleId.ADMIN, RoleId.MANAGER)
 * async someProtectedRoute() {
 *   // Only accessible by users with ADMIN or MANAGER roles
 * }
 * ```
 */
export const Roles = (...roles: RoleId[]) => SetMetadata(META_ROLES_KEY, roles);
