import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';

import { Auth, GetUser } from 'src/auth';
import { PaginationDto, ParseCuidPipe } from 'src/common';
import { User, RoleId } from 'src/user';
import { CreateVoucherDto, UpdateVoucherDto } from './dto';
import { VoucherService } from './voucher.service';

@Controller('voucher')
@Auth()
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  /**
   * Creates a new voucher in the system
   *
   * @param createVoucherDto - The DTO containing the voucher data to create
   * @param user - The authenticated user creating the voucher
   * @returns Promise containing the created voucher entity
   * @throws UnauthorizedException if user does not have sufficient permissions
   * @throws BadRequestException if validation fails
   */
  @Post()
  @Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer, RoleId.Salesperson)
  create(@Body() createVoucherDto: CreateVoucherDto, @GetUser() user: User) {
    console.log('🚀 ~ VoucherController ~ create ~ createVoucherDto:', createVoucherDto);
    return this.voucherService.create(createVoucherDto, user);
  }

  /**
   * Retrieves a paginated list of vouchers associated with a user.
   *
   * @param pagination - The pagination parameters for the request
   * @param user - The authenticated user making the request
   * @returns A Promise that resolves to a paginated list of vouchers
   *
   * @remarks
   * This endpoint supports pagination through the PaginationDto.
   * Results are filtered based on the authenticated user's context.
   */
  @Get()
  @Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer, RoleId.Warehouse, RoleId.Salesperson)
  findAll(@Query() pagination: PaginationDto, @GetUser() user: User) {
    return this.voucherService.findAll(pagination, user);
  }

  /**
   * Retrieves a single voucher by its ID
   * @param id - The CUID identifier of the voucher to retrieve
   * @param user - The authenticated user requesting the voucher
   * @returns A promise that resolves to the found voucher
   * @throws {NotFoundException} When voucher is not found
   * @throws {ForbiddenException} When user doesn't have permission to access the voucher
   */
  @Get(':id')
  @Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer, RoleId.Warehouse, RoleId.Salesperson)
  findOne(@Param('id', ParseCuidPipe) id: string, @GetUser() user: User) {
    return this.voucherService.findOne(id, user);
  }

  /**
   * Retrieves a single voucher by its number for the authenticated user
   * @param number - The unique numeric identifier of the voucher
   * @param user - The authenticated user requesting the voucher
   * @returns A Promise that resolves to the voucher if found
   * @throws NotFoundException - When voucher is not found
   * @throws ForbiddenException - When user doesn't have access to the voucher
   */
  @Get('number/:number')
  @Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer, RoleId.Warehouse, RoleId.Salesperson)
  findOneByNumber(@Param('number', ParseIntPipe) number: number, @GetUser() user: User) {
    return this.voucherService.findOneByNumber(number, user);
  }

  /**
   * Updates the status of a voucher
   * @param id - The unique CUID identifier of the voucher to update
   * @param updateDto - Data transfer object containing the updated voucher information
   * @param user - The authenticated user performing the update operation
   * @returns Promise containing the updated voucher
   * @remarks This endpoint requires authentication and proper user permissions
   * @throws {UnauthorizedException} When user lacks permissions
   * @throws {NotFoundException} When voucher with given id is not found
   */
  @Patch(':id')
  @Auth(RoleId.Admin, RoleId.Manager, RoleId.Developer, RoleId.Warehouse, RoleId.Salesperson)
  updateStatus(@Param('id', ParseCuidPipe) id: string, @Body() updateDto: UpdateVoucherDto, @GetUser() user: User) {
    console.log({ id, updateDto, user });
    return this.voucherService.update(id, updateDto, user);
  }

  /**
   * Removes a voucher from the system.
   * @param id - The CUID identifier of the voucher to remove, validated through ParseCuidPipe
   * @param user - The authenticated user performing the removal operation
   * @returns A promise that resolves to the removed voucher data
   * @throws {NotFoundException} When the voucher with the given id is not found
   * @throws {ForbiddenException} When the user doesn't have permission to remove the voucher
   */
  @Delete(':id')
  @Auth(RoleId.Admin, RoleId.Developer)
  remove(@Param('id', ParseCuidPipe) id: string, @GetUser() user: User) {
    return this.voucherService.remove(id, user);
  }

  /**
   * Restores a previously soft-deleted voucher.
   *
   * @param id - The CUID identifier of the voucher to restore
   * @param user - The authenticated user performing the restore action
   * @returns A Promise that resolves to the restored voucher
   *
   * @remarks
   * This endpoint requires authentication and will validate the CUID format through ParseCuidPipe.
   * Only vouchers that have been soft-deleted can be restored.
   *
   * @throws {NotFoundException} When the voucher with the given id is not found
   * @throws {UnauthorizedException} When the user doesn't have permission to restore the voucher
   */
  @Patch(':id/restore')
  @Auth(RoleId.Admin, RoleId.Developer)
  restore(@Param('id', ParseCuidPipe) id: string, @GetUser() user: User) {
    return this.voucherService.restore(id, user);
  }
}
