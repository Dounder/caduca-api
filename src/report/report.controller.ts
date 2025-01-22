import { Controller, Get, Res } from '@nestjs/common';
import { ReportService } from './report.service';
import { Response } from 'express';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('users')
  getReportUsers(@Res() res: Response) {
    return this.reportService.generateUserReport(res);
  }

  @Get('customers')
  getReportCustomers(@Res() res: Response) {
    return this.reportService.generateCustomerReport(res);
  }

  @Get('salespersons')
  getReportSalespersons(@Res() res: Response) {
    return this.reportService.generateSalespersonReport(res);
  }

  @Get('products')
  getReportProducts(@Res() res: Response) {
    return this.reportService.generateProductReport(res);
  }
}
