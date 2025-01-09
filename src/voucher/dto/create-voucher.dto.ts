import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsCuid } from 'src/common';
import { ReturnType, VoucherStatus } from '../interfaces';

export class CreateVoucherDto {
  @IsCuid()
  @IsNotEmpty()
  customerId: string;

  @IsEnum(ReturnType, {
    message: `returnTypeId must be ${Object.keys(ReturnType)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => `${key}: ${ReturnType[key]}`)
      .join(', ')}`,
  })
  returnTypeId: ReturnType;

  @IsIn([VoucherStatus.Draft, VoucherStatus.Submitted], {
    message: 'statusId must be either 1: Draft or 2: Submitted',
  })
  @IsOptional()
  statusId: VoucherStatus = VoucherStatus.Draft;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateVoucherItemDto)
  items: CreateVoucherItemDto[];
}

export class CreateVoucherItemDto {
  @IsNotEmpty()
  @IsCuid()
  productCodeId: string;

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
