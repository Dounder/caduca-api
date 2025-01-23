import { format } from 'date-fns';

/**
 * Utility class for date-related operations
 */
export class DateUtils {
  /**
   * Returns the current date formatted according to the specified format string
   *
   * @param formatStr - The format string to use for date formatting
   *                   Default is 'yyyy-MM-dd'
   * @returns A string representing the current date in the specified format
   *
   * @example
   * ```typescript
   * // Returns current date as "2023-12-25"
   * DateUtils.getFormattedDate();
   *
   * // Returns current date as "25/12/2023"
   * DateUtils.getFormattedDate('dd/MM/yyyy');
   * ```
   *
   * @remarks
   * This method uses the `format` function from 'date-fns' library.
   * For available format patterns, refer to date-fns documentation:
   * {@link https://date-fns.org/docs/format}
   */
  static getFormattedDate(formatStr: string = 'yyyy-MM-dd'): string {
    return format(new Date(), formatStr);
  }
}
