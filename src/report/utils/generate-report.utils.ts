import * as ExcelJS from 'exceljs';

import { DateUtils } from 'src/common';
import { ReportOptions } from '../interfaces';
import { Logger } from '@nestjs/common';
import { ExceptionHandler } from 'src/helpers';

export class GenerateReportUtils {
  static readonly logger = new Logger(GenerateReportUtils.name);
  static readonly exHandler = new ExceptionHandler(this.logger, GenerateReportUtils.name);

  /**
   * Generates an Excel report by streaming data in batches.
   *
   * @param options - The configuration options for report generation
   * @param options.res - Express response object for streaming the file
   * @param options.filename - Base name for the output Excel file
   * @param options.worksheetName - Name of the worksheet in the Excel file
   * @param options.columns - Column definitions for the Excel worksheet
   * @param options.dataFetcher - Async function that fetches data in batches with pagination
   *                             Should accept skip and limit parameters and return an array of rows
   *
   * @throws Will throw and handle errors if report generation fails
   *
   * @remarks
   * This method uses streaming to handle large datasets efficiently by:
   * - Processing data in batches of 1000 rows
   * - Using ExcelJS streaming writer
   * - Committing rows immediately to manage memory usage
   *
   * @example
   * ```typescript
   * await generateReport({
   *   res: response,
   *   filename: 'users',
   *   worksheetName: 'Users List',
   *   columns: [{ header: 'Name', key: 'name' }],
   *   dataFetcher: async (skip, limit) => await fetchUsers(skip, limit)
   * });
   * ```
   */
  static async exportExcelFile({
    res,
    filename = 'report',
    worksheetName = 'report',
    columns,
    dataFetcher,
  }: ReportOptions): Promise<void> {
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${filename}_${DateUtils.getFormattedDate('yyyy_MM_dd')}.xlsx`,
    );

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res, useStyles: false, useSharedStrings: false });
    const worksheet = workbook.addWorksheet(worksheetName);

    // Add headers
    worksheet.columns = columns;

    // Pagination variables
    const batchSize = 1000; // Number of rows per batch
    let skip = 0;
    let hasMoreData = true;

    try {
      // Fetch data in batches and write to the worksheet
      while (hasMoreData) {
        const data = await dataFetcher(skip, batchSize);

        if (data.length === 0) {
          hasMoreData = false;
        } else {
          data.forEach((row) => worksheet.addRow(row).commit());
          skip += batchSize;
        }
      }

      // Finalize the workbook and end the response
      worksheet.commit();
      workbook.commit();
    } catch (error) {
      this.logger.error('Error generating report:', error);
      this.exHandler.process(error);

      // If an error occurs, ensure the response is properly closed
      if (!res.headersSent) res.status(500).send('Error generating report');
    }
  }
}
