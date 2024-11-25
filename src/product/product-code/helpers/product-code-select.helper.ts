import { PRODUCT_SELECT_FROM_CODE } from 'src/product/helper';
import { USER_AUDIT_SELECT } from 'src/user';

export const PRODUCT_CODE_SELECT_SUMMARY = {
  select: {
    id: true,
    code: true,
  },
};

export const PRODUCT_CODE_SELECT_SINGLE = {
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  code: true,
  product: PRODUCT_SELECT_FROM_CODE,
  createdBy: USER_AUDIT_SELECT,
  updatedBy: USER_AUDIT_SELECT,
  deletedBy: USER_AUDIT_SELECT,
};
