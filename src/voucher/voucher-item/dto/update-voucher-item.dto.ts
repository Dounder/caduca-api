import { ArrayMinSize, IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { IsCuid } from 'src/common';
import { VoucherItemDto } from './voucher-item.dto';
import { Type } from 'class-transformer';

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
