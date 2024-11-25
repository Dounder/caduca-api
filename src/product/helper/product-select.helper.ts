import { USER_AUDIT_SELECT } from 'src/user';
import { PRODUCT_CODE_SELECT_SUMMARY } from '../product-code';

export const PRODUCT_SELECT_SUMMARY = {
  select: {
    id: true,
    name: true,
  },
};

export const PRODUCT_SELECT_LIST = {
  id: true,
  name: true,
  codes: PRODUCT_CODE_SELECT_SUMMARY,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  createdBy: USER_AUDIT_SELECT,
};

export const PRODUCT_SELECT_SINGLE = {
  ...PRODUCT_SELECT_LIST,
  updatedBy: USER_AUDIT_SELECT,
  deletedBy: USER_AUDIT_SELECT,
};
