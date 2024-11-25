import { RoleId, RoleItem } from 'src/user';

export const hasRoles = (userRoles: RoleItem[], validRoles: RoleId[]) => {
  return userRoles.some((role) => validRoles.includes(role.id as RoleId));
};
