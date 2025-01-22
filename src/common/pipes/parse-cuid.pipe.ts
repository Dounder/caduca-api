import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { isCuid } from '@paralleldrive/cuid2'; // Ensure to install cuid: npm install cuid

/**
 * A pipe that validates and transforms CUID strings in NestJS applications.
 *
 * This pipe implements the `PipeTransform` interface to validate if a given string
 * is a valid CUID (Collision-resistant Unique IDentifier).
 *
 * @throws {BadRequestException} When the input string is not a valid CUID
 * @returns {string} The original CUID string if validation passes
 *
 * @example
 * ```typescript
 * @Get(':id')
 * findOne(@Param('id', ParseCuidPipe) id: string) {
 *   return this.service.findOne(id);
 * }
 * ```
 */
@Injectable()
export class ParseCuidPipe implements PipeTransform<string> {
  transform(value: string): string {
    if (!isCuid(value)) throw new BadRequestException('Validation failed (CUID is expected)');

    return value;
  }
}
