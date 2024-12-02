import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

import { META_ROLES_KEY } from '../decorators';
import { CurrentUser, RoleId } from 'src/user';
import { hasRoles } from 'src/helpers';

@Injectable()
export class UserRoleGuard implements CanActivate {
  private readonly logger = new Logger(UserRoleGuard.name);
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const validRoles = this.reflector.getAllAndOverride<RoleId[]>(META_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!validRoles || validRoles.length === 0) {
      this.logger.log(`No roles found for this route, allowing access to everyone`);
      return true;
    }

    const user: CurrentUser = context.switchToHttp().getRequest().user;

    if (!user) {
      this.logger.error(`No user inside the request, make sure that we used the AuthGuard`);
      throw new InternalServerErrorException(`No user inside the request, make sure that we used the AuthGuard`);
    }

    if (hasRoles(user.roles, validRoles)) {
      this.logger.log(`User ${user.username} has the required roles to access this resource`);
      return true;
    }

    // Map RoleId enums to their string names
    const roleNames = validRoles.map((roleId) => {
      for (const [key, value] of Object.entries(RoleId)) if (value === roleId) return key;

      return roleId; // Fallback to the ID if no match found
    });

    this.logger.error(`User ${user.username} need a valid role [${roleNames.join(', ')}] to access this resource`);
    throw new ForbiddenException(
      `User ${user.username} need a valid role [${roleNames.join(', ')}] to access this resource`,
    );
  }
}
