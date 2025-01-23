import { IsNotEmpty } from 'class-validator';
import { IsCuid } from 'src/common';

/**
 * Data transfer object for creating a product code.
 *
 * @class
 * @description This DTO is used to transfer product code creation data between layers.
 * It ensures that a valid product ID is provided when creating a new product code.
 *
 * @property {string} productId - The unique identifier of the product.
 * Must be a valid CUID (Collision-resistant Unique IDentifier).
 *
 * @remarks
 * - The productId field is decorated with @IsCuid() to ensure CUID format validation
 * - @IsNotEmpty() ensures the productId is provided and not empty
 */
export class CreateProductCodeDto {
  @IsCuid()
  @IsNotEmpty()
  productId: string;
}
