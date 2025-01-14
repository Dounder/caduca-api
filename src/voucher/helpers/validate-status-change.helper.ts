import { Logger } from '@nestjs/common';
import { VoucherStatus } from 'src/voucher/interfaces';

const logger = new Logger('ValidateStatusChangeHelper');
const validStatusChanges: Record<VoucherStatus, Set<VoucherStatus>> = {
  [VoucherStatus.Draft]: new Set([VoucherStatus.Submitted]),
  [VoucherStatus.Submitted]: new Set([
    VoucherStatus.UnderReview,
    VoucherStatus.Processing,
    VoucherStatus.Approved,
    VoucherStatus.Rejected,
  ]),
  [VoucherStatus.UnderReview]: new Set([VoucherStatus.Approved, VoucherStatus.Rejected]),
  [VoucherStatus.Processing]: new Set([VoucherStatus.Approved, VoucherStatus.Rejected]),
  [VoucherStatus.Received]: new Set([VoucherStatus.Processing]),
  [VoucherStatus.Approved]: new Set(),
  [VoucherStatus.Completed]: new Set(),
  [VoucherStatus.Rejected]: new Set(),
};

export const validateVoucherStatusChange = (status: VoucherStatus, newStatus: VoucherStatus): boolean => {
  logger.log(`Validating status change from ${status} to ${newStatus}`);
  const validNextStatuses = validStatusChanges[status];

  if (!validNextStatuses) {
    logger.error(`Invalid status: ${status}`);
    return false;
  }

  return validNextStatuses.has(newStatus);
};
