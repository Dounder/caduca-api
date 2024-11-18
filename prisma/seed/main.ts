import { PrismaClient } from '@prisma/client';
import { userSeed } from './user.seed';
import { catalogSeed } from './catalog.seed';

const prisma = new PrismaClient();

const main = async () => {
  await userSeed(prisma);
  await catalogSeed(prisma);
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
