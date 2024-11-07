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
