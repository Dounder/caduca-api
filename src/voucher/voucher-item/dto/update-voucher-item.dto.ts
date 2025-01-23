import { ArrayMinSize, IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { IsCuid } from 'src/common';
import { VoucherItemDto } from './voucher-item.dto';
import { Type } from 'class-transformer';

/**
 * Data Transfer Object for updating voucher items.
 *
 * This DTO is used to update multiple voucher items associated with a specific voucher.
 * It requires a valid CUID voucher identifier and at least one voucher item.
 *
 * @class UpdateVoucherItemDto
 *
 * @property {string} voucherId - The unique identifier (CUID) of the voucher to update
 * @property {VoucherItemDto[]} items - Array of voucher items to be updated
 *
 * @remarks
 * - The voucherId must be a valid CUID and cannot be empty
 * - The items array must contain at least one VoucherItemDto object
 * - Each item in the array must be a valid VoucherItemDto instance
 */
export class UpdateVoucherItemDto {
  @IsCuid()
  @IsNotEmpty()
  voucherId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => VoucherItemDto)
  items: VoucherItemDto[];
}
