import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { isCuid } from '@paralleldrive/cuid2';

/**
 * A pipe that validates and transforms CUID strings in NestJS applications.
 *
 * @implements {PipeTransform<string>}
 *
 * @description
 * This pipe validates whether the input string is a valid CUID (Collision-resistant Unique IDentifier).
 * If validation fails, it throws a BadRequestException.
 *
 * @example
 * ```typescript
 * @Get(':id')
 * findOne(@Param('id', ParseCuidPipe) id: string) {
 *   return this.service.findOne(id);
 * }
 * ```
 *
 * @throws {BadRequestException} When the provided value is not a valid CUID
 * @returns {string} The validated CUID string
 */
@Injectable()
export class ParseCuidPipe implements PipeTransform<string> {
  transform(value: string): string {
    if (!isCuid(value)) throw new BadRequestException('Validation failed (CUID is expected)');

    return value;
  }
}
