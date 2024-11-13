import { PartialType } from '@nestjs/mapped-types';
import { CreateSalespersonDto } from './create-salesperson.dto';

export class UpdateSalespersonDto extends PartialType(CreateSalespersonDto) {}
