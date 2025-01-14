import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsCuid } from 'src/common';
import { VoucherStatus } from '../interfaces';

export class UpdateVoucherDto {
  @IsNotEmpty()
  @IsEnum(VoucherStatus, {
    message: `status must be ${Object.keys(VoucherStatus)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => `${key}: ${VoucherStatus[key]}`)
      .join(', ')}`,
  })
  status: VoucherStatus;

  @IsArray()
  @ValidateNested()
  @ArrayMinSize(1)
  @Type(() => UpdateVoucherItemDto)
  items: UpdateVoucherItemDto[];
}

export class UpdateVoucherItemDto {
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
