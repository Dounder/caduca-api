import { PrismaClient } from '@prisma/client';
import { ReturnType, VoucherStatus } from '../../src/voucher/interfaces';

interface CatalogSeed {
  items: CatalogItem[];
  model: any;
}
type CatalogItem = { id: number; name: string };

export const catalogSeed = async (prisma: PrismaClient) => {
  const data: CatalogSeed[] = [
    { items: enumToCatalogItems(VoucherStatus), model: prisma.voucherStatus },
    { items: enumToCatalogItems(ReturnType), model: prisma.voucherReturnType },
  ];

  const upserts = data.flatMap(({ items, model }) =>
    items.map(({ id, name }) => model.upsert({ where: { id }, update: { name }, create: { id, name } })),
  );

  try {
    await prisma.$transaction(upserts);
  } catch (error) {
    console.error('Error seeding the catalog:', error);
  }
};

const enumToCatalogItems = (enumObj: object): CatalogItem[] => {
  return Object.entries(enumObj)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => ({
      id: value as number,
      name: key.replace(/([a-z])([A-Z])/g, '$1 $2'), // Add space before uppercase letters
    }));
};
