import type { RedisClientOptions } from 'redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-yet';
import { envs } from 'src/config';

/**
 * Redis Module Configuration for Caching
 *
 * Configures and provides Redis caching functionality using NestJS CacheModule.
 * This module sets up Redis as the caching store with the following configurations:
 *
 * @remarks
 * The module uses environment variables for configuration:
 * - redisUrl: Connection URL for Redis server
 * - cacheTtl: Time-to-live for cached items
 * - redisDb: Redis database number to use
 *
 * @example
 * ```typescript
 * imports: [RedisModule]
 * ```
 *
 * @exports CacheModule - Exports the configured CacheModule for use in other modules
 */
@Module({
  imports: [
    CacheModule.register<RedisClientOptions>({
      store: redisStore,
      url: envs.redisUrl,
      ttl: envs.cacheTtl,
      database: envs.redisDb,
    }),
  ],
  exports: [CacheModule],
})
export class RedisModule {}
