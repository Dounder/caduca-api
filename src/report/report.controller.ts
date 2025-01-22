import { Response } from 'express';

import { Controller, Get, Res } from '@nestjs/common';
import { Auth } from 'src/auth';
import { ReportService } from './report.service';

@Controller('report')
@Auth()
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
