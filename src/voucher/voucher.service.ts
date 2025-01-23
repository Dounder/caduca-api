import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ExceptionHandler, hasRoles, ListResponse, PaginationDto } from 'src/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleId, User } from 'src/user';
import { CreateVoucherDto, UpdateVoucherDto, UpdateVoucherItemDto } from './dto';
import { validateVoucherStatusChange, VOUCHER_SELECT_LIST, VOUCHER_SELECT_SINGLE } from './helpers';
import { Voucher, VoucherItem, VoucherList, VoucherStatus } from './interfaces';
import { VOUCHER_ITEM_SINGLE } from './voucher-item';

@Injectable()
export class VoucherService {
  private readonly logger = new Logger(VoucherService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, VoucherService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new voucher with the provided data and items.
   *
   * @param createVoucherDto - The data transfer object containing voucher details and items
   * @param user - The authenticated user creating the voucher
   * @returns A promise that resolves to the created voucher with selected fields
   *
   * @remarks
   * This method:
   * - Creates a voucher record in the database
   * - Associates it with the creating user
   * - Creates a log entry for the creation
   * - Creates multiple voucher items in a single transaction
   *
   * @throws Will process and handle any database or validation errors through exHandler
   */
  async create(createVoucherDto: CreateVoucherDto, user: User): Promise<Voucher> {
    const { items, ...data } = createVoucherDto;
    const message = `Creating voucher: ${JSON.stringify(data)} with: ${items.length} items, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      const voucher = await this.prisma.voucher.create({
        data: {
          ...data,
          createdById: user.id,
          logs: { create: { message, createdBy: { connect: { id: user.id } } } },
          items: { createMany: { data: items } },
        },
        select: VOUCHER_SELECT_SINGLE,
      });

      return voucher;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Retrieves a paginated list of vouchers based on search criteria and user permissions.
   *
   * @param pagination - The pagination parameters
   * @param pagination.page - The current page number
   * @param pagination.limit - The number of items per page
   * @param pagination.search - Optional search string to filter vouchers by number or customer name
   * @param user - The authenticated user making the request
   *
   * @returns A paginated response containing:
   * - meta: Metadata about the pagination {total, page, lastPage}
   * - data: Array of vouchers matching the criteria
   *
   * @remarks
   * - Admin users can see soft-deleted vouchers, while regular users cannot
   * - Search is case insensitive and matches either voucher number or customer name
   * - If search contains a number, it will try to match the voucher number exactly
   */
  async findAll(pagination: PaginationDto, user: User): Promise<ListResponse<VoucherList>> {
    const { page, limit, search } = pagination;
    const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
    const where = {
      AND: [
        isAdmin ? {} : { deletedAt: null },
        search
          ? {
              OR: [
                { number: { equals: parseInt(search) || undefined } },
                { customer: { name: { contains: search, mode: 'insensitive' as const } } },
              ],
            }
          : {},
      ],
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.voucher.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where,
        select: VOUCHER_SELECT_LIST,
      }),
      this.prisma.voucher.count({ where }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return { meta: { total, page, lastPage }, data };
  }

  /**
   * Retrieves a single voucher by its ID, with different behavior for admin and non-admin users.
   *
   * @param id - The unique identifier of the voucher to retrieve
   * @param user - The user requesting the voucher
   * @returns Promise containing the voucher information if found
   *
   * @remarks
   * - Admin users can see soft-deleted vouchers
   * - Non-admin users can only see non-deleted vouchers
   * - Uses VOUCHER_SELECT_SINGLE for field selection
   *
   * @throws {NotFoundException} When no voucher is found with the given ID
   * @throws Propagates any other errors through ExceptionHandler
   */
  async findOne(id: string, user: User): Promise<Voucher> {
    this.logger.log(`Fetching voucher: ${id}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
      const where = isAdmin ? { id } : { id, deletedAt: null };

      const voucher = await this.prisma.voucher.findFirst({
        where,
        select: VOUCHER_SELECT_SINGLE,
      });

      if (!voucher)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Voucher with id ${id} not found`,
        });

      return voucher;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Retrieves a single voucher by its number for a given user.
   *
   * @param number - The unique number identifier of the voucher
   * @param user - The user requesting the voucher
   *
   * @returns A Promise that resolves to the voucher if found
   *
   * @throws {NotFoundException} When voucher is not found
   *
   * @remarks
   * - If user has Admin role, it will fetch both active and deleted vouchers
   * - For non-admin users, only active vouchers (deletedAt: null) are returned
   * - Uses VOUCHER_SELECT_SINGLE for field selection
   * - All errors are processed through exHandler
   */
  async findOneByNumber(number: number, user: User): Promise<Voucher> {
    this.logger.log(`Fetching voucher: #${number}, user: ${user.username} (${user.id})`);
    try {
      const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
      const where = isAdmin ? { number } : { number, deletedAt: null };

      const voucher = await this.prisma.voucher.findFirst({
        where,
        select: VOUCHER_SELECT_SINGLE,
      });

      if (!voucher)
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: `[ERROR] Voucher with number #${number} not found`,
        });

      return voucher;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Updates a voucher's status and optionally its items.
   *
   * @param id - The unique identifier of the voucher to update
   * @param updateDto - Data transfer object containing the update information
   * @param user - The user performing the update operation
   *
   * @throws {ConflictException} When the status change is invalid according to business rules
   * @throws {NotFoundException} When the voucher is not found (via findOne)
   * @throws {ForbiddenException} When the user doesn't have permission (via findOne)
   *
   * @remarks
   * The method performs the following operations:
   * 1. Validates if the status change is allowed
   * 2. Updates voucher items if provided
   * 3. Updates the voucher status
   * 4. Records the status change in logs
   * 5. Updates approval/rejection dates based on the new status
   *
   * All database operations are performed within a transaction to ensure data consistency.
   *
   * @returns A promise that resolves to the updated voucher information (VoucherResponse)
   */
  async update(id: string, updateDto: UpdateVoucherDto, user: User): Promise<Voucher> {
    const { status, items } = updateDto;
    this.logger.log(`Updating voucher: ${id}, user: ${user.username} (${user.id})`);

    try {
      // Retrieve the current voucher
      const voucher = await this.findOne(id, user);
      const oldStatus = voucher.status.id as VoucherStatus;

      // Validate new status
      const isValidChange = validateVoucherStatusChange(oldStatus, status);
      if (!isValidChange) {
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Invalid status change from ${VoucherStatus[oldStatus]} (${oldStatus}) to ${VoucherStatus[status]} (${status})`,
        });
      }

      // Build log message
      const message = `Change status from ${VoucherStatus[oldStatus]} (${oldStatus}) to ${VoucherStatus[status]} (${status}), user: ${user.username} (${user.id})`;

      // Perform updates in a transaction
      const updatedVoucher = await this.prisma.$transaction(async (prisma) => {
        // Update items if they exist
        if (items && items.length > 0) await this.updateItems(voucher.id, items, user);

        // Update the voucher status and add a log entry
        return prisma.voucher.update({
          where: { id },
          data: {
            approvedDate: status === VoucherStatus.Approved ? new Date() : null,
            rejectedDate: status === VoucherStatus.Rejected ? new Date() : null,
            status: { connect: { id: status } },
            logs: { create: { message, createdBy: { connect: { id: user.id } } } },
          },
          select: VOUCHER_SELECT_SINGLE,
        });
      });

      return updatedVoucher;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Performs a soft delete on a voucher by setting its deletedAt timestamp.
   *
   * @param id - The unique identifier of the voucher to delete
   * @param user - The user performing the delete operation
   *
   * @throws {ConflictException} When trying to delete an already deleted voucher
   * @throws {NotFoundException} When voucher is not found (through findOne)
   * @throws {ForbiddenException} When user doesn't have permission to delete the voucher (through findOne)
   *
   * @returns Promise with the updated voucher including deletion metadata
   *
   * @remarks
   * - This is a soft delete operation - the voucher is marked as deleted but remains in the database
   * - Creates a log entry documenting the deletion
   * - The operation connects the deletion to the user who performed it
   */
  async remove(id: string, user: User): Promise<Voucher> {
    const message = `Deleting voucher: ${id}, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      const voucher = await this.findOne(id, user);

      if (voucher.deletedAt) {
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Voucher with id ${id} cannot be deleted`,
        });
      }

      return await this.prisma.voucher.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: { connect: { id: user.id } },
          logs: { create: { message, createdBy: { connect: { id: user.id } } } },
        },
        select: VOUCHER_SELECT_SINGLE,
      });
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Restores a soft-deleted voucher by setting its deletedAt field to null.
   *
   * @param id - The unique identifier of the voucher to restore
   * @param user - The user performing the restore operation
   *
   * @throws {ConflictException} When trying to restore a voucher that is not deleted
   * @throws {NotFoundException} When the voucher is not found
   * @throws {ForbiddenException} When the user doesn't have permission to access the voucher
   *
   * @returns {Promise<Voucher>} The restored voucher with its associated data
   *
   * @remarks
   * This method:
   * - Logs the restore operation
   * - Verifies the voucher exists and is deleted
   * - Removes the deletion metadata
   * - Creates a log entry for the restoration
   * - Returns the updated voucher with selected fields
   */
  async restore(id: string, user: User): Promise<Voucher> {
    const message = `Restoring voucher: ${id}, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      const voucher = await this.findOne(id, user);

      if (!voucher.deletedAt) {
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: `[ERROR] Voucher with id ${id} cannot be restored`,
        });
      }

      return await this.prisma.voucher.update({
        where: { id },
        data: {
          deletedAt: null,
          deletedBy: { disconnect: { id: user.id } },
          logs: { create: { message, createdBy: { connect: { id: user.id } } } },
        },
        select: VOUCHER_SELECT_SINGLE,
      });
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Updates multiple voucher items in a single transaction and logs the operation.
   *
   * @param voucherId - The unique identifier of the voucher containing the items to update
   * @param items - Array of items with their updated values
   * @param user - The user performing the update operation
   *
   * @throws {BadRequestException} When items array is empty or undefined
   * @throws {PrismaClientKnownRequestError} When database constraints are violated
   * @throws {PrismaClientUnknownRequestError} When unexpected database errors occur
   *
   * @returns Promise containing array of updated VoucherItem entities
   *
   * @remarks
   * - All items are updated in a single transaction to ensure data consistency
   * - A log entry is created for the operation
   * - If any item update fails, the entire transaction is rolled back
   * - The deletedById field is only set when deletedAt is present
   */
  async updateItems(voucherId: string, items: UpdateVoucherItemDto[], user: User): Promise<VoucherItem[]> {
    if (!items || items.length === 0)
      throw new BadRequestException({ status: HttpStatus.BAD_REQUEST, message: 'Items are required' });

    const message = `Updating ${items.length} voucher items for voucher ${voucherId}, user: ${user.username} (${user.id})`;
    this.logger.log(message, { details: items });

    const itemUpdates = items.map((item) => ({
      where: { id: item.id },
      data: { ...item, updatedById: user.id, deletedById: item.deletedAt ? user.id : null },
      select: VOUCHER_ITEM_SINGLE,
    }));

    try {
      const updatedItems = await this.prisma.$transaction(async (prisma) => {
        const updated = await Promise.all(itemUpdates.map(prisma.voucherItem.update));

        await prisma.voucherLog.create({ data: { voucherId, message, createdById: user.id } });

        return updated;
      });

      return updatedItems;
    } catch (error) {
      this.exHandler.process(error);
    }
  }
}
