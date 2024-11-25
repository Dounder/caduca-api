import { PrismaClient } from '@prisma/client';
import { userSeed } from './user.seed';
import { catalogSeed } from './catalog.seed';
import { roleSeed } from './role.seed';

const prisma = new PrismaClient();

const main = async () => {
  await catalogSeed(prisma);
  await roleSeed(prisma);
  await userSeed(prisma);
};

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
