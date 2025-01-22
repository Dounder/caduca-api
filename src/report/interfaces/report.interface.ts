import * as ExcelJS from 'exceljs';
import { Response } from 'express';

export interface ReportOptions {
  res: Response;
  filename?: string;
  worksheetName?: string;
  columns: Partial<ExcelJS.Column>[];
  dataFetcher: (skip: number, take: number) => Promise<any[]>;
}
