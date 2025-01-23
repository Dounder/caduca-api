import { Cache } from 'cache-manager';

interface Params<T> {
  cacheManager: Cache;
  cacheKey: string;
  callback: () => Promise<T>;
}

export class cacheUtil {
  static async getCachedResponse<T>({ cacheManager, cacheKey, callback }: Params<T>): Promise<T> {
    const cachedResponse = await cacheManager.get<T>(cacheKey);

    if (cachedResponse) return cachedResponse;

    const response = await callback();
    await cacheManager.set(cacheKey, response);

    return response;
  }
}
