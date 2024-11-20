import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNotEmpty, IsOptional, IsPositive, Min } from 'class-validator';
import { IsCuid } from 'src/common';

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
