import { Type } from 'class-transformer';
import { IsOptional, IsNotEmpty, IsPositive, Min, IsDate, IsBoolean } from 'class-validator';
import { IsCuid } from 'src/common';

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
