import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Role } from '../../src/user';

export const userSeed = async (prisma: PrismaClient) => {
  await prisma.user.upsert({
    where: { id: 'cm2t3swzl000d0cjw07z1dthk' },
    update: {
      password: bcrypt.hashSync('Abcd@123', 10),
    },
    create: {
      id: 'cm2t3swzl000d0cjw07z1dthk',
      username: 'admin',
      email: 'admin@google.com',
      password: bcrypt.hashSync('Abcd@123', 10),
      userRoles: { create: { roleId: Role.Admin } },
    },
  });
};
