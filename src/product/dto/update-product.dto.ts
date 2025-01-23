import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

/**
 * Data Transfer Object (DTO) for updating a product entity.
 * Extends the CreateProductDto as a partial type, making all properties optional.
 *
 * @remarks
 * This DTO uses NestJS's `PartialType` utility to create a type with all properties
 * from CreateProductDto set as optional. This is useful for PATCH operations where
 * only some fields might need to be updated.
 *
 * @example
 * ```typescript
 * // Example usage:
 * const updateData: UpdateProductDto = {
 *   name: "Updated Product Name",
 *   // Other properties are optional
 * };
 * ```
 *
 * @see {@link CreateProductDto} - The base DTO class this extends from
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
