import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { VoucherStatus } from '../interfaces';

@Injectable()
export class ParseVoucherStatusPipe implements PipeTransform {
  transform(value: any): VoucherStatus {
    if (value === undefined || value === null)
      throw new BadRequestException('The "status" query parameter is required.');

    const statusValue = parseInt(value, 10);

    if (!Object.values(VoucherStatus).includes(statusValue)) {
      throw new BadRequestException(
        `Invalid status value. Allowed values are: ${Object.keys(VoucherStatus)
          .filter((key) => !isNaN(Number(key)))
          .map((key) => `${key}: ${VoucherStatus[key]}`)
          .join(', ')}`,
      );
    }

    return statusValue as VoucherStatus;
  }
}
