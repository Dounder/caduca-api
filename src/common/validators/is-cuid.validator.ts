import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isCuid } from '@paralleldrive/cuid2'; // You can use a library like cuid

/**
 * Custom validator constraint to check if a value is a valid CUID.
 * A CUID is a collision-resistant unique identifier.
 *
 * @implements {ValidatorConstraintInterface}
 *
 * @remarks
 * This validator allows null/undefined values to pass validation.
 * For stricter validation, consider combining with @IsNotEmpty() decorator.
 *
 * @example
 * ```typescript
 * @IsCuid()
 * id: string;
 * ```
 */
@ValidatorConstraint({ async: false })
export class IsCuidConstraint implements ValidatorConstraintInterface {
  /**
   * Validates if a given string is a valid CUID.
   * A CUID is a collision-resistant unique identifier.
   *
   * @param cuidValue - The string value to validate as CUID
   * @returns {boolean} True if the value is a valid CUID or if it's undefined/null, false otherwise
   *
   * @remarks
   * The validator is permissive with undefined/null values, returning true in these cases.
   * This behavior allows for optional CUID fields in validation scenarios.
   *
   * @example
   * ```typescript
   * validate('ch72gsb320000udocl363eofy') // returns true
   * validate(null) // returns true
   * validate('not-a-cuid') // returns false
   * ```
   */
  validate(cuidValue: string): boolean {
    if (cuidValue === undefined || cuidValue === null) return true;

    return isCuid(cuidValue);
  }

  /**
   * Gets the default validation error message for the CUID validator.
   * This message is displayed when a value fails CUID validation.
   *
   * @returns {string} A string containing the default validation error message
   *
   * @remarks
   * CUID (Collision-resistant Unique IDentifier) is a string format designed
   * to generate unique identifiers that are:
   * - Collision-resistant (sufficient randomness)
   * - Secure (no predetermined patterns)
   * - URL-safe (no special characters)
   */
  defaultMessage(): string {
    return 'The value provided must be a valid CUID';
  }
}

/**
 * Decorator that validates if a property value is a valid CUID (Collision-resistant Unique IDentifier).
 *
 * This decorator can be used to ensure that string properties contain valid CUID values,
 * which are useful for generating unique identifiers in distributed systems.
 *
 * @param validationOptions - Optional validation constraints as defined by class-validator
 * @returns A PropertyDecorator function that registers the CUID validation constraint
 *
 * @example
 * ```typescript
 * class Example {
 *   @IsCuid()
 *   public id: string;
 * }
 * ```
 *
 * @remarks
 * - The validator uses the IsCuidConstraint to perform the actual validation
 * - This decorator is meant to be used with class-validator framework
 * - CUID format follows the specification from https://github.com/ericelliott/cuid
 */
export function IsCuid(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCuidConstraint,
    });
  };
}
