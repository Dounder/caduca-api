import { USER_AUDIT_SELECT } from 'src/common';

export const PRODUCT_SELECT_SUMMARY = {
  select: {
    id: true,
    name: true,
    createdAt: true,
    createdBy: USER_AUDIT_SELECT,
  },
};

export const PRODUCT_CODE_SELECT_SUMMARY = {
  select: {
    id: true,
    code: true,
    createdAt: true,
    product: PRODUCT_SELECT_SUMMARY,
    createdBy: USER_AUDIT_SELECT,
  },
};
