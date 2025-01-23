import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

/**
 * Data Transfer Object for creating a product.
 *
 * @class
 * @description Validates the data required to create a new product in the system.
 *
 * @property {string} name - The name of the product. Must not be empty and cannot exceed 300 characters.
 * @property {boolean} newCode - Optional flag indicating if the product requires a new code generation.
 *                              Defaults to false if not provided.
 *
 * @remarks
 * - The name property is required and will be validated for emptiness and length
 * - The newCode property is optional and will be automatically converted to boolean type
 */
export class CreateProductDto {
  @IsNotEmpty()
  @MaxLength(300)
  name: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  newCode: boolean = false;
}
