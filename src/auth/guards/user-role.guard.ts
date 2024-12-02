import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

import { META_ROLES_KEY } from '../decorators';
import { CurrentUser, RoleId } from 'src/user';
import { hasRoles } from 'src/helpers';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const validRoles = this.reflector.getAllAndOverride<RoleId[]>(META_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!validRoles || validRoles.length === 0) return true;

    const user: CurrentUser = context.switchToHttp().getRequest().user;

    if (!user)
      throw new InternalServerErrorException(`No user inside the request, make sure that we used the AuthGuard`);

    if (hasRoles(user.roles, validRoles)) return true;

    // Map RoleId enums to their string names
    const roleNames = validRoles.map((roleId) => {
      for (const [key, value] of Object.entries(RoleId)) if (value === roleId) return key;

      return roleId; // Fallback to the ID if no match found
    });

    throw new ForbiddenException(
      `User ${user.username} need a valid role [${roleNames.join(', ')}] to access this resource`,
    );
  }
}
