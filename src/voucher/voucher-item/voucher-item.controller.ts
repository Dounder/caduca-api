import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';

import { Auth, GetUser } from 'src/auth';
import { ListResponse, PaginationDto } from 'src/common';
import { User } from 'src/user';
import { VoucherItem } from '../interfaces';
import { CreateVoucherItemDto, UpdateVoucherItemDto } from './dto';
import { VoucherItemService } from './voucher-item.service';

@Auth()
@Controller('voucher/item')
export class VoucherItemController {
  constructor(private readonly voucherItemService: VoucherItemService) {}

  /**
   * Creates a new voucher item in the system
   *
   * @param createVoucherItemDto - The DTO containing the voucher item data to be created
   * @param user - The authenticated user creating the voucher item
   * @returns A Promise that resolves to the newly created VoucherItem
   *
   * @remarks
   * The user parameter is automatically injected by the @GetUser() decorator
   * This endpoint requires authentication
   *
   * @throws {UnauthorizedException} When the user is not authenticated
   * @throws {ValidationError} When the createVoucherItemDto fails validation
   */
  @Post()
  create(@Body() createVoucherItemDto: CreateVoucherItemDto, @GetUser() user: User): Promise<VoucherItem> {
    return this.voucherItemService.create(createVoucherItemDto, user);
  }

  /**
   * Retrieves a paginated list of voucher items for the authenticated user.
   *
   * @param pagination - Pagination parameters for the query
   * @param user - The authenticated user making the request
   * @returns A promise that resolves to a ListResponse containing the paginated voucher items
   *
   * @remarks
   * This endpoint supports pagination through the PaginationDto parameters.
   * Results are filtered based on the authenticated user's access permissions.
   */
  @Get(':voucherId')
  findAll(@Query() pagination: PaginationDto, @GetUser() user: User): Promise<ListResponse<VoucherItem>> {
    return this.voucherItemService.findAll(pagination, user);
  }

  /**
   * Updates one or more voucher items associated with a user
   * @param updateVoucherItemDto - The data transfer object containing the voucher item update information
   * @param user - The authenticated user performing the update
   * @returns A promise that resolves to an array of updated VoucherItem objects
   * @throws UnauthorizedException - If the user doesn't have permission to update the voucher item
   * @throws NotFoundException - If the voucher item to update is not found
   */
  @Patch()
  update(@Body() updateVoucherItemDto: UpdateVoucherItemDto, @GetUser() user: User): Promise<VoucherItem[]> {
    return this.voucherItemService.update(updateVoucherItemDto, user);
  }
}
