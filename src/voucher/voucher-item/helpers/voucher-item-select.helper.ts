import { USER_AUDIT_SELECT } from 'src/common';
import { PRODUCT_CODE_SELECT_SUMMARY } from 'src/product';

export const VOUCHER_ITEM_SINGLE = {
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  quantity: true,
  expirationDate: true,
  observation: true,
  received: true,

  productCode: PRODUCT_CODE_SELECT_SUMMARY,
  createdBy: USER_AUDIT_SELECT,
  updatedBy: USER_AUDIT_SELECT,
  deletedBy: USER_AUDIT_SELECT,
};
