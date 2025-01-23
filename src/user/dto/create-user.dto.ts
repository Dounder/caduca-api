import { Transform } from 'class-transformer';
import { IsArray, IsEmail, IsEnum, IsOptional, IsString, IsStrongPassword, MinLength } from 'class-validator';
import { RoleId } from '../interfaces';
import { IsCuid } from 'src/common';

/**
 * Data Transfer Object for creating a new user.
 *
 * @remarks
 * This DTO validates and transforms user input data before creating a user.
 * - Username and email are automatically trimmed and converted to lowercase
 * - Password is optional but must be strong if provided
 * - Roles default to Staff if not specified
 *
 * @example
 * ```typescript
 * const userDto = {
 *   username: "johndoe",
 *   email: "john@example.com",
 *   password: "StrongPass123!",
 *   roles: [RoleId.Staff, RoleId.Admin]
 * };
 * ```
 */
export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @Transform(({ value }) => value.trim().toLowerCase())
  username: string;

  @IsString()
  @IsEmail()
  @Transform(({ value }) => value.trim().toLowerCase())
  email: string;

  @IsString()
  @MinLength(6)
  @IsStrongPassword()
  @IsOptional()
  password?: string;

  @IsArray()
  @IsEnum(RoleId, { each: true }) // Ensure all roles are valid RoleIds
  @IsOptional()
  roles?: RoleId[] = [RoleId.Staff];
}
