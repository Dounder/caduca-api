import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsPositive } from 'class-validator';

/**
 * Data Transfer Object for handling pagination parameters in API requests.
 *
 * @class PaginationDto
 * @property {number} page - The page number to retrieve (defaults to 1)
 * @property {number} limit - Number of items per page (defaults to 10)
 * @property {boolean} summary - Whether to return summarized data (defaults to false)
 * @property {string} search - Optional search query string to filter results
 *
 * @example
 * {
 *   page: 1,
 *   limit: 10,
 *   summary: false,
 *   search: "keyword"
 * }
 */
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
