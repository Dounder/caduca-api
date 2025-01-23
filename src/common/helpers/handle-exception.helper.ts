import { BadRequestException, HttpStatus, LoggerService } from '@nestjs/common';

/**
 * A utility class for handling exceptions in a standardized way across the application.
 * It provides centralized error logging and consistent HTTP exception throwing.
 *
 * @class ExceptionHandler
 *
 * @property {LoggerService} logger - Service used for logging error information
 * @property {string} context - Context identifier for logging purposes
 *
 * @example
 * ```typescript
 * const logger = new LoggerService();
 * const handler = new ExceptionHandler(logger, 'UserService');
 *
 * try {
 *   // Some operation that might fail
 * } catch (error) {
 *   handler.process(error, 'Failed to process user request');
 * }
 * ```
 *
 * @remarks
 * This class wraps errors with a standardized format and ensures proper logging
 * before throwing HTTP exceptions. It's particularly useful for REST API endpoints
 * where consistent error handling is crucial.
 *
 * @see {@link LoggerService}
 * @see {@link BadRequestException}
 */
export class ExceptionHandler {
  private logger: LoggerService;
  private context: string;

  /**
   * Initializes a new instance of the class with logger and context information.
   * @param logger - The logger service instance used for logging operations
   * @param context - The context string identifying the source or scope of the logs
   */
  constructor(logger: LoggerService, context: string) {
    this.logger = logger;
    this.context = context;
  }

  /**
   * Processes and handles exceptions by logging them and throwing appropriate HTTP exceptions.
   *
   * @param error - The error object to be processed
   * @param msg - Optional custom error message, defaults to 'Unexpected Error, check logs'
   * @throws {Error} - If the original error message includes '[ERROR]'
   * @throws {BadRequestException} - For all other errors, wrapped with '[ERROR]' prefix
   * @returns {void}
   *
   * @example
   * ```typescript
   * handleException.process(new Error("Database connection failed"), "Database error");
   * ```
   */
  public process(error: any, msg: string = 'Unexpected Error, check logs'): void {
    this.logger.error(error, { context: this.context });

    if (error.message.includes('[ERROR]')) throw error;

    throw new BadRequestException({ status: HttpStatus.BAD_REQUEST, message: `[ERROR] ${msg}` });
  }
}
