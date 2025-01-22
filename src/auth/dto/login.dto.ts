import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

/**
 * Data Transfer Object (DTO) for user login.
 * Contains the necessary fields for authenticating a user.
 *
 * @class LoginDto
 * @export
 *
 * @example
 * const loginDto = new LoginDto();
 * loginDto.username = "john.doe";
 * loginDto.password = "secretPassword123";
 */
export class LoginDto {
  @IsString()
  @Transform(({ value }) => value.toLowerCase())
  username: string;

  @IsString()
  password: string;
}
