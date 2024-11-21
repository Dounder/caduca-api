export const USER_AUDIT_SELECT = {
  select: {
    id: true,
    username: true,
    email: true,
  },
};

export const USER_SELECT_SINGLE = {
  id: true,
  username: true,
  email: true,
  userRoles: { select: { role: { select: { id: true, name: true } } } },
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  createdBy: USER_AUDIT_SELECT,
  updatedBy: USER_AUDIT_SELECT,
  deletedBy: USER_AUDIT_SELECT,
};

export const USER_SELECT_SINGLE_PWD = {
  ...USER_SELECT_SINGLE,
  password: true,
};
