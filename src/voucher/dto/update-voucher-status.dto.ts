import { IsEnum, IsNotEmpty } from 'class-validator';
import { VoucherStatus } from '../interfaces';

export class UpdateVoucherStatusDto {
  @IsNotEmpty()
  @IsEnum(VoucherStatus, {
    message: `status must be ${Object.keys(VoucherStatus)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => `${key}: ${VoucherStatus[key]}`)
      .join(', ')}`,
  })
  status: VoucherStatus;
}
