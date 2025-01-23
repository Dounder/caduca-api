import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto';

/**
 * Data Transfer Object (DTO) for updating a customer.
 * Extends the `CreateCustomerDto` as a partial type, making all properties optional.
 *
 * This allows for partial updates where only some properties of the customer need to be modified,
 * rather than requiring all properties to be present in the update operation.
 *
 * @extends {PartialType<CreateCustomerDto>}
 */
export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
