import { PRODUCT_SELECT_FROM_CODE, PRODUCT_SELECT_FROM_CODE_SUMMARY } from 'src/product/helper';
import { USER_AUDIT_SELECT } from 'src/user';

export const PRODUCT_CODE_SELECT_SUMMARY = {
  select: {
    id: true,
    code: true,
  },
};

export const PRODUCT_CODE_SELECT_LIST = {
  id: true,
  code: true,
  product: PRODUCT_SELECT_FROM_CODE_SUMMARY,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  createdBy: USER_AUDIT_SELECT,
};

export const PRODUCT_CODE_SELECT_LIST_SUMMARY = {
  id: true,
  code: true,
  product: PRODUCT_SELECT_FROM_CODE_SUMMARY,
};

export const PRODUCT_CODE_SELECT_SINGLE = {
  ...PRODUCT_CODE_SELECT_LIST,
  updatedBy: USER_AUDIT_SELECT,
  deletedBy: USER_AUDIT_SELECT,
};
