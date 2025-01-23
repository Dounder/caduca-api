import { BadRequestException, HttpStatus, Injectable, Logger } from '@nestjs/common';

import { ExceptionHandler, hasRoles, ListResponse, PaginationDto } from 'src/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleId, User } from 'src/user';
import { VoucherItem } from '../interfaces';
import { CreateVoucherItemDto, UpdateVoucherItemDto } from './dto';
import { VOUCHER_ITEM_SINGLE } from './helpers';

@Injectable()
export class VoucherItemService {
  private readonly logger = new Logger(VoucherItemService.name);
  private readonly exHandler = new ExceptionHandler(this.logger, VoucherItemService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new voucher item and logs the creation action.
   *
   * @param createVoucherItemDto - The data transfer object containing the voucher item details
   * @param user - The authenticated user performing the creation
   * @returns A Promise that resolves to the created VoucherItem
   *
   * @remarks
   * This method performs two operations in a single transaction:
   * 1. Creates a new voucher item in the database
   * 2. Creates a log entry for the voucher creation
   *
   * If any error occurs during the transaction, it will be handled by the exception handler.
   *
   * @throws Will throw an error if the database transaction fails or if the data is invalid
   */
  async create(createVoucherItemDto: CreateVoucherItemDto, user: User): Promise<VoucherItem> {
    const message = `Creating voucher item: ${JSON.stringify(createVoucherItemDto)}, user: ${user.username} (${user.id})`;
    this.logger.log(message);
    try {
      const [voucherItem] = await this.prisma.$transaction([
        this.prisma.voucherItem.create({
          data: { ...createVoucherItemDto, createdById: user.id },
          select: VOUCHER_ITEM_SINGLE,
        }),
        this.prisma.voucherLog.create({
          data: { voucherId: createVoucherItemDto.voucherId, message, createdById: user.id },
        }),
      ]);

      return voucherItem;
    } catch (error) {
      this.exHandler.process(error);
    }
  }

  /**
   * Retrieves a paginated list of voucher items
   *
   * @param pagination - Object containing pagination parameters (page and limit)
   * @param user - The user requesting the voucher items
   *
   * @returns A Promise that resolves to a ListResponse containing:
   *          - meta: Pagination metadata (total items, current page, last page)
   *          - data: Array of voucher items
   *
   * @remarks
   * - If the user has Admin role, all voucher items are returned (including soft-deleted ones)
   * - For non-admin users, only non-deleted voucher items are returned
   * - Results are filtered using VOUCHER_ITEM_SINGLE select clause
   */
  async findAll(pagination: PaginationDto, user: User): Promise<ListResponse<VoucherItem>> {
    const { page, limit } = pagination;
    const isAdmin = hasRoles(user.roles, [RoleId.Admin]);
    const where = isAdmin ? {} : { deletedAt: null };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.voucherItem.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where,
        select: VOUCHER_ITEM_SINGLE,
      }),
      this.prisma.voucherItem.count({ where }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return { meta: { total, page, lastPage }, data };
  }

  /**
   * Updates multiple voucher items in a single transaction.
   *
   * @param updateVoucherItemDto - The DTO containing the voucher ID and items to update
   * @param updateVoucherItemDto.voucherId - The ID of the voucher containing the items
   * @param updateVoucherItemDto.items - Array of voucher items to update
   * @param user - The user performing the update operation
   *
   * @throws {BadRequestException} When no items are provided or items array is empty
   * @returns Promise resolving to an array of updated VoucherItem objects
   *
   * @remarks
   * This method:
   * - Validates that items array is not empty
   * - Logs the update operation
   * - Updates all items in a single transaction
   * - Creates a voucher log entry for audit trail
   * - Sets updatedById and deletedById (if item is marked for deletion) to current user
   *
   * All operations are performed in a single transaction to ensure data consistency.
   */
  async update(updateVoucherItemDto: UpdateVoucherItemDto, user: User): Promise<VoucherItem[]> {
    try {
      const { voucherId, items } = updateVoucherItemDto;

      if (!items || items.length === 0)
        throw new BadRequestException({ status: HttpStatus.BAD_REQUEST, message: 'Items are required' });

      const message = `Updating ${items.length} voucher items for voucher ${voucherId}, user: ${user.username} (${user.id})`;
      this.logger.log(message, { details: items });

      const itemUpdates = items.map((item) => ({
        where: { id: item.id },
        data: { ...item, updatedById: user.id, deletedById: item.deletedAt ? user.id : null },
        select: VOUCHER_ITEM_SINGLE,
      }));

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
