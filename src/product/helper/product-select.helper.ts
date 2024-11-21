import { USER_AUDIT_SELECT } from 'src/common';

export const PRODUCT_SELECT_SUMMARY = {
  select: {
    id: true,
    name: true,
  },
};

export const PRODUCT_CODE_SELECT_SUMMARY = {
  select: {
    id: true,
    code: true,
    product: PRODUCT_SELECT_SUMMARY,
  },
};
