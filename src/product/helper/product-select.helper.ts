import { USER_AUDIT_SELECT } from 'src/user';
import { PRODUCT_CODE_SELECT_SUMMARY } from 'src/product/product-code/helpers';

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

export const PRODUCT_SELECT_FROM_CODE = {
  select: {
    id: true,
    name: true,
    createdAt: true,
    createdBy: {
      select: {
        id: true,
        username: true,
        email: true,
      },
    },
  },
};
