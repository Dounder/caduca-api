import { IsNotEmpty, MaxLength } from 'class-validator';

/**
 * Data transfer object used for updating product information.
 *
 * This DTO validates input data when updating a product entity.
 *
 * @class
 *
 * @property {string} name - The product name
 * @remarks
 * - Name is required and cannot be empty
 * - Name must not exceed 300 characters
 */
export class UpdateProductDto {
  @IsNotEmpty()
  @MaxLength(300)
  name: string;
}
