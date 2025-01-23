import { Injectable } from '@nestjs/common';
import { Catalog } from 'src/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class VoucherCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(): Promise<Catalog[]> {
    return this.prisma.voucherStatus.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReturnType(): Promise<Catalog[]> {
    return this.prisma.voucherReturnType.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
