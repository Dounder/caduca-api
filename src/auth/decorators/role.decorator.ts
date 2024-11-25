import { SetMetadata } from '@nestjs/common';
import { RoleId } from 'src/user';

export const META_ROLES_KEY = 'roles';

export const Roles = (...roles: RoleId[]) => SetMetadata(META_ROLES_KEY, roles);
