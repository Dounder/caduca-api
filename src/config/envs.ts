import 'dotenv/config';
import joi from 'joi';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  REDIS_URL: string;
  CACHE_TTL: number;
  REDIS_DB: number;
}

/**
 * Environment variables validation schema using Joi.
 *
 * @remarks
 * This schema validates the following environment variables:
 * - PORT: Required number for the server port
 * - DATABASE_URL: Required string for database connection
 * - JWT_SECRET: Required string for JWT token signing
 * - REDIS_URL: Required string for Redis connection
 * - CACHE_TTL: Required number for cache time-to-live (in seconds)
 * - REDIS_DB: Required number for Redis database selection
 *
 * @example
 * ```env
 * PORT=3000
 * DATABASE_URL=postgresql://user:password@localhost:5432/db
 * JWT_SECRET=your-secret-key
 * REDIS_URL=redis://localhost:6379
 * CACHE_TTL=86400
 * REDIS_DB=0
 * ```
 *
 * The schema allows additional environment variables through the `.unknown(true)` setting.
 */
const envSchema = joi
  .object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
    JWT_SECRET: joi.string().required(),
    REDIS_URL: joi.string().required(),
    CACHE_TTL: joi.number().required(), // 24 hours
    REDIS_DB: joi.number().required(),
  })
  .unknown(true);

const { error, value } = envSchema.validate({ ...process.env });

if (error) throw new Error(`Config validation error: ${error.message}`);

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  databaseUrl: envVars.DATABASE_URL,
  jwtSecret: envVars.JWT_SECRET,
  redisUrl: envVars.REDIS_URL,
  cacheTtl: envVars.CACHE_TTL,
  redisDb: envVars.REDIS_DB,
};
