import { BaseResponse } from 'src/common';
import { Role } from './role.interface';

export interface User extends BaseResponse {
  username: string;
  email: string;
  roles: Role[];
}

export interface UserWithPwd extends User {
  password: string;
}

export interface UserSummary {
  id: string;
  username: string;
  email: string;
}

export interface PrismaUser extends BaseResponse {
  username: string;
  email: string;
  userRoles: UserRole[];
}

export interface UserRole {
  role: Role;
}
