import { USER_AUDIT_SELECT } from 'src/user';

export const SALESPERSON_SUMMARY = {
  select: { id: true, name: true, code: true },
};

export const SALESPERSON_SELECT_LIST = {
  id: true,
  code: true,
  name: true,
  address: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  createdBy: USER_AUDIT_SELECT,
};

export const SALESPERSON_SELECT_SINGLE = {
  ...SALESPERSON_SELECT_LIST,
  updatedBy: USER_AUDIT_SELECT,
  deletedBy: USER_AUDIT_SELECT,
};

export const SALESPERSON_SELECT_LIST_SUMMARY = {
  id: true,
  code: true,
  name: true,
};
