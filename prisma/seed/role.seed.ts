import { PrismaClient } from '@prisma/client';

const roles = [
  {
    id: 'cm3rmdiwl00010clfbut56c4r',
    name: 'Admin',
    description: 'Responsible for managing system-wide settings and overseeing all operations.',
  },
  {
    id: 'cm3rmdiwl00020clf179p5y92',
    name: 'Manager',
    description: 'Supervises teams and ensures projects and tasks are completed efficiently.',
  },
  {
    id: 'cm3rmdiwm00030clf2sw508so',
    name: 'Staff',
    description: 'Handles day-to-day operational tasks and activities.',
  },
  {
    id: 'cm3rmdiwm00040clf27ymcarm',
    name: 'Developer',
    description: 'Responsible for designing, building, and maintaining the software systems.',
  },
  {
    id: 'cm3rmdiwm00050clffszl8rox',
    name: 'Salesperson',
    description: 'Manages client relationships and facilitates product sales.',
  },
  {
    id: 'cm3rmdiwm00060clfg8032oef',
    name: 'Customer',
    description: 'End user or client interacting with the system.',
  },
  {
    id: 'cm3rmdiwm00070clf3w8288g4',
    name: 'Warehouse',
    description: 'Handles storage, inventory, and distribution of goods.',
  },
];

export const roleSeed = async (prisma: PrismaClient) => {
  const upserts = roles.map(({ id, name, description }) =>
    prisma.role.upsert({
      where: { id },
      update: { name, description },
      create: { id, name, description },
    }),
  );

  try {
    await prisma.$transaction(upserts);
    console.log('Roles seeded successfully');
  } catch (error) {
    console.error('Error seeding the roles:', error);
  }
};
