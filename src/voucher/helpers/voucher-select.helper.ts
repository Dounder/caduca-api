import { CATALOG_SELECT, USER_AUDIT_SELECT } from 'src/common';
import { CUSTOMER_SUMMARY } from 'src/customer';

export const VOUCHER_SELECT_LIST = {
  id: true,
  number: true,
  approvedDate: true,
  rejectedDate: true,
  customer: CUSTOMER_SUMMARY,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  createdBy: USER_AUDIT_SELECT,
  status: CATALOG_SELECT,
  returnType: CATALOG_SELECT,
};

export const VOUCHER_SELECT_SINGLE = {
  ...VOUCHER_SELECT_LIST,
  updatedBy: USER_AUDIT_SELECT,
  deletedBy: USER_AUDIT_SELECT,
};
