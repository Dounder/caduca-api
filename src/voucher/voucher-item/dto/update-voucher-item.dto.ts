import { PartialType } from '@nestjs/mapped-types';
import { CreateVoucherItemDto } from './create-voucher-item.dto';

export class UpdateVoucherItemDto extends PartialType(CreateVoucherItemDto) {}
