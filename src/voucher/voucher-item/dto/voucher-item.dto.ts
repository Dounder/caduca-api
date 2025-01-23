import { Type } from 'class-transformer';
import { IsOptional, IsNotEmpty, IsPositive, Min, IsDate, IsBoolean } from 'class-validator';
import { IsCuid } from 'src/common';

/**
 * Data Transfer Object representing a Voucher Item entity.
 * @class
 *
 * @property {string} id - Unique identifier in CUID format
 * @property {string} [productCodeId] - Optional reference to a product code in CUID format
 * @property {number} [quantity] - Optional quantity, must be a positive integer greater than or equal to 1
 * @property {Date} [expirationDate] - Optional expiration date for the voucher item
 * @property {string} [observation] - Optional observation text, defaults to empty string
 * @property {boolean} [received] - Optional flag indicating if the item was received, defaults to false
 * @property {Date} [deletedAt] - Optional soft deletion timestamp
 *
 * @remarks
 * All optional properties are marked with class-validator decorators to ensure data integrity.
 * The DTO uses the `@Type()` decorator from class-transformer for Date type conversion.
 */
export class VoucherItemDto {
  @IsNotEmpty()
  @IsCuid()
  id: string;

  @IsOptional()
  @IsNotEmpty()
  @IsCuid()
  productCodeId?: string;

  @IsOptional()
  @IsPositive()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  expirationDate?: Date;

  @IsOptional()
  observation?: string = '';

  @IsOptional()
  @IsBoolean()
  received?: boolean = false;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deletedAt?: Date;
}
