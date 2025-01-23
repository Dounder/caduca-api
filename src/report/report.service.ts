import { Injectable, Logger, Res } from '@nestjs/common';
import { Response } from 'express';

import { GenerateReportUtils } from './utils';
import { ExceptionHandler } from 'src/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleNameEs } from 'src/user';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates and exports an Excel report containing user information.
   * The report includes username, email, status, roles and creation date for each user.
   *
   * @param res - Express Response object used to send the generated Excel file
   * @returns Promise that resolves when the file has been generated and sent
   *
   * @remarks
   * The report is generated in chunks/batches to handle large datasets efficiently.
   * Users' status is determined by the presence of a deletedAt timestamp.
   * Role names are converted from enum values to Spanish display names.
   *
   * @example
   * ```typescript
   * // In a controller
   * await reportService.generateUserReport(response);
   * ```
   *
   * @throws {PrismaClientKnownRequestError} If there's an error accessing the database
   * @throws {Error} If there's an error generating the Excel file
   */
  async generateUserReport(@Res() res: Response): Promise<void> {
    this.logger.log('Generating user report');

    // Define columns for the users report
    const columns = [
      { header: 'Usuario', key: 'username', width: 20 },
      { header: 'Correo', key: 'email', width: 30 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Roles', key: 'roles', width: 40 },
      { header: 'Fecha de creación', key: 'createdAt', width: 20 },
    ];

    // Define the data fetcher for users
    const dataFetcher = async (skip: number, take: number) => {
      const data = await this.prisma.user.findMany({
        skip,
        take,
        select: {
          username: true,
          email: true,
          deletedAt: true,
          createdAt: true,
          userRoles: { select: { role: { select: { name: true } } } },
        },
      });

      return data.map((item) => ({
        ...item,
        status: item.deletedAt ? 'Inactivo' : 'Activo',
        roles: item.userRoles.map((ur) => RoleNameEs[ur.role.name]).join(', '),
      }));
    };

    // Generate the report
    await GenerateReportUtils.exportExcelFile({
      res,
      filename: 'usuarios',
      worksheetName: 'Usuarios',
      columns,
      dataFetcher,
    });
  }

  /**
   * Generates an Excel report containing customer information.
   * The report includes customer code, name, address and status.
   *
   * @param res - Express Response object used to send the file to the client
   * @returns Promise that resolves when the report has been generated and sent
   *
   * @remarks
   * The report is generated in chunks to handle large datasets efficiently.
   * Status is derived from deletedAt field: 'Activo' if null, 'Inactivo' otherwise.
   * The Excel file will be named 'clientes.xlsx' with 'Clientes' as the worksheet name.
   *
   * @throws {Error} If there's an issue accessing the database or generating the Excel file
   */
  async generateCustomerReport(@Res() res: Response): Promise<void> {
    this.logger.log('Generating customer report');

    // Define columns for the users report
    const columns = [
      { header: 'Código', key: 'code', width: 10 },
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Dirección', key: 'address', width: 30 },
      { header: 'Estado', key: 'status', width: 30 },
    ];

    // Define the data fetcher for users
    const dataFetcher = async (skip: number, take: number) => {
      const data = await this.prisma.customer.findMany({
        skip,
        take,
        select: { code: true, name: true, address: true, deletedAt: true },
      });

      return data.map((item) => ({
        ...item,
        status: item.deletedAt ? 'Inactivo' : 'Activo',
      }));
    };

    // Generate the report
    await GenerateReportUtils.exportExcelFile({
      res,
      filename: 'clientes',
      worksheetName: 'Clientes',
      columns,
      dataFetcher,
    });
  }

  /**
   * Generates an Excel report containing salesperson information.
   *
   * The report includes the following columns:
   * - Code (Código)
   * - Name (Nombre)
   * - Status (Estado)
   *
   * The status is determined by the deletedAt field:
   * - If deletedAt is null, status is "Activo"
   * - If deletedAt has a value, status is "Inactivo"
   *
   * @param res - Express Response object used to send the generated Excel file
   * @returns Promise that resolves when the file has been generated and sent
   *
   * @remarks
   * The data is fetched in batches using the Prisma client.
   * The Excel file is named 'vendedores.xlsx' and contains a worksheet named 'Vendedores'.
   *
   * @throws {PrismaClientKnownRequestError} If there's an error accessing the database
   * @throws {Error} If there's an error generating the Excel file
   */
  async generateSalespersonReport(@Res() res: Response): Promise<void> {
    this.logger.log('Generating salesperson report');

    // Define columns for the users report
    const columns = [
      { header: 'Código', key: 'code', width: 10 },
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Estado', key: 'status', width: 30 },
    ];

    // Define the data fetcher for users
    const dataFetcher = async (skip: number, take: number) => {
      const data = await this.prisma.salesperson.findMany({
        skip,
        take,
        select: { code: true, name: true, deletedAt: true },
      });

      return data.map((item) => ({
        ...item,
        status: item.deletedAt ? 'Inactivo' : 'Activo',
      }));
    };

    // Generate the report
    await GenerateReportUtils.exportExcelFile({
      res,
      filename: 'vendedores',
      worksheetName: 'Vendedores',
      columns,
      dataFetcher,
    });
  }

  /**
   * Generates an Excel report containing product information.
   *
   * @param res - Express Response object used to send the generated Excel file
   *
   * @remarks
   * The report includes the following columns:
   * - Código (Code): Product codes joined by commas
   * - Nombre (Name): Product name
   * - Estado (Status): Product status (Activo/Inactivo)
   *
   * The data is fetched in batches using Prisma, and the report is generated
   * using the GenerateReportUtils utility class.
   *
   * @throws {PrismaClientKnownRequestError} If there's an error accessing the database
   * @throws {Error} If there's an error generating the Excel file
   *
   * @returns Promise that resolves when the Excel file has been generated and sent
   */
  async generateProductReport(@Res() res: Response): Promise<void> {
    this.logger.log('Generating product report');

    // Define columns for the users report
    const columns = [
      { header: 'Código', key: 'code', width: 10 },
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Estado', key: 'status', width: 30 },
    ];

    // Define the data fetcher for users
    const dataFetcher = async (skip: number, take: number) => {
      const data = await this.prisma.product.findMany({
        skip,
        take,
        select: { name: true, deletedAt: true, codes: { select: { code: true } } },
      });

      return data.map((item) => ({
        ...item,
        status: item.deletedAt ? 'Inactivo' : 'Activo',
        codes: item.codes.length > 0 ? item.codes.map((c) => c.code).join(', ') : 'Sin códigos',
      }));
    };

    // Generate the report
    await GenerateReportUtils.exportExcelFile({
      res,
      filename: 'productos',
      worksheetName: 'Productos',
      columns,
      dataFetcher,
    });
  }
}
