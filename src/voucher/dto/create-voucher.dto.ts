import { IsEnum, IsIn, IsNotEmpty } from 'class-validator';
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
  statusId: VoucherStatus;
}
