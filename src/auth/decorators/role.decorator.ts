import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/user';

export const META_ROLES_KEY = 'roles';

export const Roles = (...roles: Role[]) => SetMetadata(META_ROLES_KEY, roles);
