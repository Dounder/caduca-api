import { Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

interface Params<T> {
  cacheManager: Cache;
  cacheKey: string;
  callback: () => Promise<T>;
}

/**
 * Utility class providing static methods for cache management operations.
 *
 * @remarks
 * This class provides two main functionalities:
 * - Retrieving and managing cached responses
 * - Clearing cache entries based on key patterns
 *
 * The class uses a Logger instance to track cache operations for debugging purposes.
 *
 * @example
 * ```typescript
 * // Get cached response
 * const data = await cacheUtil.getCachedResponse({
 *   cacheManager,
 *   cacheKey: 'user:123',
 *   callback: () => fetchUserData(123)
 * });
 *
 * // Clear cache
 * await cacheUtil.clearCache(cacheManager, 'user:*');
 * ```
 *
 * @public
 */
export class CacheUtil {
  static readonly logger = new Logger(CacheUtil.name);

  /**
   * Retrieves a cached response or executes a callback to get and cache new data.
   *
   * @typeParam T - The type of the cached/returned value
   *
   * @param params - The parameters object
   * @param params.cacheManager - The cache manager instance to handle cache operations
   * @param params.cacheKey - The key used to store/retrieve the cached value
   * @param params.callback - Async function to execute when cache miss occurs
   *
   * @returns A promise that resolves to the cached value or the new value from the callback
   *
   * @remarks
   * This method first checks if a value exists in cache for the given key.
   * If found, returns the cached value. If not, executes the callback function,
   * stores its result in cache, and returns the new value.
   *
   * @example
   * ```typescript
   * const data = await CacheUtil.getCachedResponse({
   *   cacheManager: myCacheManager,
   *   cacheKey: 'my-key',
   *   callback: async () => await fetchData()
   * });
   * ```
   */
  static async getCachedResponse<T>({ cacheManager, cacheKey, callback }: Params<T>): Promise<T> {
    const cachedResponse = await cacheManager.get<T>(cacheKey);

    if (cachedResponse) {
      this.logger.log(`Returning cache response for key: ${cacheKey}`);
      return cachedResponse;
    }

    const response = await callback();
    await cacheManager.set(cacheKey, response);
    this.logger.log(`Setting cache response for key: ${cacheKey}`);

    return response;
  }

  /**
   * Clears cache entries for a given key pattern from the cache manager.
   *
   * @param cacheManager - The cache manager instance to clear entries from
   * @param key - The key pattern to match cache entries that should be cleared
   *
   * @remarks
   * This method will:
   * 1. Log the clear cache operation
   * 2. Find all keys matching the provided pattern
   * 3. Delete all matching entries if any are found
   *
   * @throws {Error} If there's an error accessing the cache store
   *
   * @example
   * ```typescript
   * await CacheUtil.clearCache(cacheManager, 'users:*');
   * ```
   */
  static async clearCache(cacheManager: Cache, key: string): Promise<void> {
    this.logger.log(`Clearing cache for key: ${key}`);
    const keys = await cacheManager.store.keys(key);
    if (keys.length > 0) await cacheManager.store.mdel(...keys);
  }
}
