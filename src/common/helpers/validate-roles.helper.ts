import { RoleId, RoleItem } from 'src/user';

/**
 * Checks if a user has any of the specified valid roles.
 *
 * @param userRoles - Array of role objects containing role information
 * @param validRoles - Array of valid role IDs to check against
 * @returns boolean - True if user has at least one of the valid roles, false otherwise
 *
 * @example
 * const userRoles = [{ id: 'ADMIN', name: 'Administrator' }];
 * const validRoles = ['ADMIN', 'SUPER_ADMIN'];
 * const hasAccess = hasRoles(userRoles, validRoles); // returns true
 *
 * @remarks
 * - The function uses Array.some() to check if at least one role matches
 * - Role IDs are type-casted to RoleId type for type safety
 */
export const hasRoles = (userRoles: RoleItem[], validRoles: RoleId[]) => {
  return userRoles.some((role) => validRoles.includes(role.id as RoleId));
};
