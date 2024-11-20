import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Role } from '../../src/user';

export const userSeed = async (prisma: PrismaClient) => {
  await prisma.user.upsert({
    where: { id: 'cm2t3swzl000d0cjw07z1dthj' },
    update: {
      password: bcrypt.hashSync('Dev@123', 10),
    },
    create: {
      id: 'cm2t3swzl000d0cjw07z1dthj',
      username: 'dev',
      email: 'dev@google.com',
      password: bcrypt.hashSync('Dev@123', 10),
      roles: [Role.Developer],
    },
  });

  await prisma.user.upsert({
    where: { id: 'cm2t3swzl000d0cjw07z1dthk' },
    update: {
      password: bcrypt.hashSync('Admin@123', 10),
    },
    create: {
      id: 'cm2t3swzl000d0cjw07z1dthk',
      username: 'admin',
      email: 'admin@google.com',
      password: bcrypt.hashSync('Admin@123', 10),
      roles: [Role.Admin],
      createdById: 'cm2t3swzl000d0cjw07z1dthj',
      updatedById: 'cm2t3swzl000d0cjw07z1dthj',
    },
  });

  await prisma.user.upsert({
    where: { id: 'cm2t3swzl000d0cjw07z1dthl' },
    update: {
      password: bcrypt.hashSync('Staff@123', 10),
    },
    create: {
      id: 'cm2t3swzl000d0cjw07z1dthl',
      username: 'staff',
      email: 'staff@google.com',
      password: bcrypt.hashSync('Staff@123', 10),
      roles: [Role.Staff],
      createdById: 'cm2t3swzl000d0cjw07z1dthj',
      updatedById: 'cm2t3swzl000d0cjw07z1dthj',
    },
  });

  await prisma.user.upsert({
    where: { id: 'cm2t3swzl000d0cjw07z1dthm' },
    update: {
      password: bcrypt.hashSync('Manager@123', 10),
    },
    create: {
      id: 'cm2t3swzl000d0cjw07z1dthm',
      username: 'manager',
      email: 'manager@google.com',
      password: bcrypt.hashSync('Manager@123', 10),
      roles: [Role.Manager],
      createdById: 'cm2t3swzl000d0cjw07z1dthj',
      updatedById: 'cm2t3swzl000d0cjw07z1dthj',
    },
  });
};
