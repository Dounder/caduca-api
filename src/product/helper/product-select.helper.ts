import { USER_AUDIT_SELECT } from 'src/user';

export const PRODUCT_SELECT_SUMMARY = {
  select: {
    id: true,
    name: true,
  },
};

export const PRODUCT_SELECT_LIST = {
  id: true,
  name: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  createdBy: USER_AUDIT_SELECT,
};

export const PRODUCT_SELECT_SINGLE = {
  ...PRODUCT_SELECT_LIST,
  codes: { select: { id: true, code: true } },
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

export const PRODUCT_SELECT_FROM_CODE_SUMMARY = {
  select: { id: true, name: true },
};

export const PRODUCT_SELECT_LIST_SUMMARY = {
  id: true,
  name: true,
};
