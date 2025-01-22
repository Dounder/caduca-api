import { format } from 'date-fns';

/**
 * Utility class for date-related operations
 */
export class DateUtils {
  /**
   * Returns current date formatted according to the specified format string
   * @param formatStr - The format string to use (defaults to 'yyyy-MM-dd')
   * @returns Formatted date string
   * @example
   * ```typescript
   * // Returns current date as '2023-12-25'
   * DateUtils.getFormattedDate('yyyy-MM-dd')
   *
   * // Returns current date as '25/12/2023'
   * DateUtils.getFormattedDate('dd/MM/yyyy')
   * ```
   */
  static getFormattedDate(formatStr: string = 'yyyy-MM-dd'): string {
    return format(new Date(), formatStr);
  }
}
