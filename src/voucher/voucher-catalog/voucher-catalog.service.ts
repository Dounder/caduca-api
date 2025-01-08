import { Injectable } from '@nestjs/common';
import { CatalogResponse } from 'src/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class VoucherCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(): Promise<CatalogResponse[]> {
    return this.prisma.voucherStatus.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReturnType(): Promise<CatalogResponse[]> {
    return this.prisma.voucherReturnType.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
