import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class SummaryPaginationDto extends PaginationDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  summary: boolean;
}
