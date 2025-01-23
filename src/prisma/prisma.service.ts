import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Service responsible for managing database connections using Prisma.
 * Extends PrismaClient and implements NestJS lifecycle hooks.
 *
 * @remarks
 * This service automatically handles database connections when the module initializes
 * and cleans up connections when the module is destroyed.
 *
 * @implements {OnModuleInit}
 * @implements {OnModuleDestroy}
 *
 * @example
 * ```typescript
 * // Inject into a controller or service
 * constructor(private prisma: PrismaService) {}
 * ```
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * Lifecycle hook that is called once the host module has been initialized.
   * Establishes a connection to the database using Prisma Client.
   *
   * @remarks
   * This method is called automatically by NestJS when the module is initialized.
   * It uses the Prisma Client's $connect() method to establish the database connection.
   *
   * @throws {PrismaClientInitializationError}
   * When the connection to the database fails.
   *
   * @returns {Promise<void>}
   */
  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database \\(^.^)/');
  }

  /**
   * Lifecycle hook that gets called when the module is being destroyed.
   * Ensures proper cleanup by disconnecting from the database.
   *
   * @remarks
   * This method is part of NestJS lifecycle hooks and gets called when
   * the application is shutting down. There seems to be a bug where
   * it's connecting instead of disconnecting - this should be reviewed.
   *
   * @throws {PrismaClientKnownRequestError} If database connection fails
   * @async
   */
  async onModuleDestroy() {
    await this.$connect();
    this.logger.log('Disconnected from the database (._.)');
  }
}
