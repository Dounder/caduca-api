import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Get, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { VoucherCatalogService } from './voucher-catalog.service';

@Controller('voucher/catalog')
export class VoucherCatalogController {
  constructor(
    private readonly voucherCatalogService: VoucherCatalogService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get('status')
  getStatus() {
    return this.getCachedResponse('voucher:status', () => this.voucherCatalogService.getStatus());
  }

  @Get('return_type')
  getReturnType() {
    return this.getCachedResponse('voucher:return_type', () => this.voucherCatalogService.getReturnType());
  }

  private async getCachedResponse<T>(cacheKey: string, callback: () => Promise<T>): Promise<T> {
    const cachedResponse = await this.cacheManager.get<T>(cacheKey);

    if (cachedResponse) return cachedResponse;

    const response = await callback();
    await this.cacheManager.set(cacheKey, response);

    return response;
  }
}
