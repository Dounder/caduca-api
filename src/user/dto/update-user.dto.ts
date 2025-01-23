import { Transform } from 'class-transformer';
import { IsArray, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RoleId } from '../interfaces';

/**
 * Data Transfer Object for updating user information.
 * All fields are optional, allowing partial updates.
 *
 * @remarks
 * - Username and email are automatically trimmed and converted to lowercase
 * - Roles must be valid entries from the RoleId enum
 *
 * @example
 * ```typescript
 * {
 *   username: "johndoe",
 *   email: "john@example.com",
 *   roles: [RoleId.USER, RoleId.ADMIN]
 * }
 * ```
 */
export class UpdateUserDto {
  @IsString()
  @MinLength(2)
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsOptional()
  username?: string;

  @IsString()
  @IsEmail()
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsOptional()
  email?: string;

  @IsArray()
  @IsEnum(RoleId, { each: true }) // Ensure all roles are valid RoleIds
  @IsOptional()
  roles?: RoleId[];
}
