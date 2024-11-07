import { BadRequestException, HttpStatus, LoggerService } from '@nestjs/common';

export class ExceptionHandler {
  private logger: LoggerService;
  private context: string;

  constructor(logger: LoggerService, context: string) {
    this.logger = logger;
    this.context = context;
  }

  /**
   * Processes an error by logging it and throwing an appropriate exception.
   *
   * @param error - The error object to be processed.
   * @param msg - An optional message to be included in the thrown exception. Defaults to 'Unexpected Error, check logs'.
   * @throws {BadRequestException} Throws a BadRequestException if the error message does not include '[ERROR]'.
   * @throws {Error} Re-throws the original error if the error message includes '[ERROR]'.
   */
  public process(error: any, msg: string = 'Unexpected Error, check logs'): void {
    this.logger.error(error, { context: this.context });

    if (error.message.includes('[ERROR]')) throw error;

    throw new BadRequestException({ status: HttpStatus.BAD_REQUEST, message: `[ERROR] ${msg}` });
  }
}
