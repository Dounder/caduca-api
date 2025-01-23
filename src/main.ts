import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config';

/**
 * Initializes and bootstraps the NestJS application with necessary configurations.
 *
 * This function:
 * - Creates a new logger instance for bootstrap operations
 * - Initializes the NestJS application with AppModule
 * - Enables CORS for cross-origin requests
 * - Sets 'api' as the global route prefix
 * - Configures global validation pipe with whitelist options
 * - Starts the server on the configured port
 *
 * @remarks
 * The validation pipe is configured to:
 * - Strip properties not explicitly allowed (whitelist: true)
 * - Reject requests with non-whitelisted properties (forbidNonWhitelisted: true)
 *
 * @throws {Error} If the application fails to initialize or start
 * @returns {Promise<void>} A promise that resolves when the application is running
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = envs.port;
  await app.listen(port);
  logger.log(`Server running on port: ${port}`);
}
bootstrap();
