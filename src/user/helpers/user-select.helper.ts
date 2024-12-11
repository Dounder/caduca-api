export const USER_AUDIT_SELECT = {
  select: {
    id: true,
    username: true,
    email: true,
  },
};

export const USER_SELECT_LIST = {
  id: true,
  username: true,
  email: true,
  userRoles: { select: { role: { select: { id: true, name: true } } }, where: { deletedAt: null } },
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  createdBy: USER_AUDIT_SELECT,
};

export const USER_SELECT_SINGLE = {
  ...USER_SELECT_LIST,
  updatedBy: USER_AUDIT_SELECT,
  deletedBy: USER_AUDIT_SELECT,
};

export const USER_SELECT_SINGLE_PWD = {
  ...USER_SELECT_SINGLE,
  password: true,
};

export const USER_SELECT_LIST_SUMMARY = {
  id: true,
  username: true,
  email: true,
};
