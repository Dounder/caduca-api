import * as ExcelJS from 'exceljs';

import { DateUtils } from 'src/common';
import { ReportOptions } from '../interfaces';
import { Logger } from '@nestjs/common';
import { ExceptionHandler } from 'src/common';

export class GenerateReportUtils {
  static readonly logger = new Logger(GenerateReportUtils.name);
  static readonly exHandler = new ExceptionHandler(this.logger, GenerateReportUtils.name);

  /**
   * Exports data to an Excel file with streaming support for large datasets.
   *
   * @param options - The configuration options for the report generation
   * @param options.res - The Express response object
   * @param options.filename - The name of the file to be downloaded (default: 'report')
   * @param options.worksheetName - The name of the worksheet in the Excel file (default: 'report')
   * @param options.columns - The column definitions for the Excel worksheet
   * @param options.dataFetcher - A function that fetches data in batches, receiving skip and limit parameters
   *
   * @returns Promise<void>
   *
   * @throws Will throw an error if the report generation fails
   *
   * @remarks
   * The method implements pagination to handle large datasets efficiently.
   * It processes data in batches of 1000 rows to prevent memory issues.
   * Special characters in the filename are replaced with underscores.
   * The final filename includes the current date in 'yyyy_MM_dd' format.
   *
   * @example
   * ```typescript
   * await ReportUtils.exportExcelFile({
   *   res: response,
   *   filename: 'users',
   *   worksheetName: 'Users List',
   *   columns: [{header: 'Name', key: 'name'}, {header: 'Email', key: 'email'}],
   *   dataFetcher: async (skip, limit) => await getUsersBatch(skip, limit)
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
    const formattedFilename = filename.replace(/[^a-zA-Z0-9]/g, '_'); // Remove special characters from filename

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${formattedFilename}_${DateUtils.getFormattedDate('yyyy_MM_dd')}.xlsx"`,
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
