import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  summary?: boolean = false;

  @IsOptional()
  @IsNotEmpty()
  @Type(() => String)
  search?: string;
}
