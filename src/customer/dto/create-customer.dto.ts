import { IsNotEmpty, MaxLength } from 'class-validator';

/**
 * Data Transfer Object (DTO) for creating a new customer.
 * Contains the essential information needed to create a customer record.
 *
 * @class
 *
 * @property {string} name - The customer's full name. Must not be empty and cannot exceed 100 characters.
 * @property {string} address - The customer's complete address. Must not be empty and cannot exceed 1000 characters.
 */
export class CreateCustomerDto {
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNotEmpty()
  @MaxLength(1000)
  address: string;
}
