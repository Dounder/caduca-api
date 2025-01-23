import { Response } from 'express';

import { Controller, Get, Res } from '@nestjs/common';
import { Auth } from 'src/auth';
import { ReportService } from './report.service';

@Auth()
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * Generates a report of users in the system
   *
   * @param res - Express Response object used to send the file download
   * @returns Promise that resolves when the report has been generated and sent
   *
   * @remarks
   * This endpoint streams the report directly to the client as a file download.
   * The response type is handled by the service layer.
   */
  @Get('users')
  getReportUsers(@Res() res: Response) {
    return this.reportService.generateUserReport(res);
  }

  /**
   * Handles the generation of a customer report.
   *
   * @param res - Express Response object used to send the report to the client
   * @returns A Promise that resolves when the report has been generated and sent
   *
   * @remarks
   * This endpoint streams the report directly to the client through the Response object.
   * The actual report generation is delegated to the reportService.
   */
  @Get('customers')
  getReportCustomers(@Res() res: Response) {
    return this.reportService.generateCustomerReport(res);
  }

  /**
   * Generates a report for salespersons and sends it as a response
   *
   * @param {Response} res - Express Response object to handle the HTTP response
   * @returns {Promise<void>} A promise that resolves when the report is generated and sent
   *
   * @remarks
   * This endpoint streams the report directly to the client using the Response object.
   * The actual report generation is handled by the reportService.
   */
  @Get('salespersons')
  getReportSalespersons(@Res() res: Response) {
    return this.reportService.generateSalespersonReport(res);
  }

  /**
   * Generates a report containing product information and sends it as a response.
   *
   * @param res - Express Response object used to send the report
   * @returns A Promise that resolves when the report has been generated and sent
   *
   * @remarks
   * This endpoint streams the report directly to the client using the Response object.
   * The actual report generation is handled by the ReportService.
   */
  @Get('products')
  getReportProducts(@Res() res: Response) {
    return this.reportService.generateProductReport(res);
  }
}
