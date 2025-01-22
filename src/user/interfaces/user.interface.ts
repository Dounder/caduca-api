export enum RoleId {
  Admin = 'cm3rmdiwl00010clfbut56c4r',
  Manager = 'cm3rmdiwl00020clf179p5y92',
  Staff = 'cm3rmdiwm00030clf2sw508so',
  Developer = 'cm3rmdiwm00040clf27ymcarm',
  Salesperson = 'cm3rmdiwm00050clffszl8rox',
  Customer = 'cm3rmdiwm00060clfg8032oef',
  Warehouse = 'cm3rmdiwm00070clf3w8288g4',
}

export enum RoleNameEs {
  Admin = 'Administrador',
  Manager = 'Gerente',
  Staff = 'Personal',
  Developer = 'Desarrollador',
  Salesperson = 'Vendedor',
  Customer = 'Cliente',
  Warehouse = 'Almacén',
}

export interface RoleItem {
  id: string;
  name: string;
  description?: string;
}

export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  roles: RoleItem[];
  createdAt: Date;
  updateAt: Date;
  deletedAt?: Date;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  roles: RoleItem[];
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt: Date | null;
  createdBy: UserSummary | null;
  updatedBy?: UserSummary | null;
  deletedBy?: UserSummary | null;
  password?: string;
}

export interface UserSummary {
  id: string;
  username: string;
  email: string;
}

export interface PrismaUserList {
  id: string;
  username: string;
  email: string;
  userRoles: UserRole[];
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt: Date | null;
  createdBy: UserSummary | null;
  updatedBy?: UserSummary | null;
  deletedBy?: UserSummary | null;
}

export interface UserRole {
  role: RoleItem;
}
