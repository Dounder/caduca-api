import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNotEmpty, IsOptional, IsPositive, Min } from 'class-validator';
import { IsCuid } from 'src/common';

/**
 * Data Transfer Object for creating a new voucher item.
 *
 * @remarks
 * This DTO validates the input data for creating a new voucher item using class-validator decorators.
 * All required fields must be provided and meet the validation criteria.
 *
 * @property {string} productCodeId - The unique CUID identifier for the product code
 * @property {string} voucherId - The unique CUID identifier for the voucher this item belongs to
 * @property {number} quantity - The quantity of items, must be a positive integer greater than or equal to 1
 * @property {Date} expirationDate - The expiration date for the voucher item
 * @property {string} [observation] - Optional additional notes or comments about the voucher item, defaults to empty string
 * @property {boolean} [received] - Optional flag indicating if the item has been received, defaults to false
 */
export class CreateVoucherItemDto {
  @IsNotEmpty()
  @IsCuid()
  productCodeId: string;

  @IsNotEmpty()
  @IsCuid()
  voucherId: string;

  @IsPositive()
  @Min(1)
  quantity: number;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  expirationDate: Date;

  @IsOptional()
  observation: string = '';

  @IsOptional()
  @IsBoolean()
  received: boolean = false;
}
