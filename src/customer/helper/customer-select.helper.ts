import { USER_AUDIT_SELECT } from 'src/user';

export const CUSTOMER_SUMMARY = {
  select: { id: true, name: true, code: true },
};

export const CUSTOMER_SELECT_LIST = {
  id: true,
  code: true,
  name: true,
  address: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  createdBy: USER_AUDIT_SELECT,
};

export const CUSTOMER_SELECT_SINGLE = {
  ...CUSTOMER_SELECT_LIST,
  updatedBy: USER_AUDIT_SELECT,
  deletedBy: USER_AUDIT_SELECT,
};

export const CUSTOMER_SELECT_LIST_SUMMARY = {
  id: true,
  code: true,
  name: true,
};
