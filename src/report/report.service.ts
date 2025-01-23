import { Injectable, Logger, Res } from '@nestjs/common';
import { Response } from 'express';

import { GenerateReportUtils } from './utils';
import { ExceptionHandler } from 'src/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleNameEs } from 'src/user';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, ReportService.name);

  constructor(private readonly prisma: PrismaService) {}

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
