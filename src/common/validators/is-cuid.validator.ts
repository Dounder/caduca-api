import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isCuid } from '@paralleldrive/cuid2'; // You can use a library like cuid

/**
 * Custom validator constraint for CUID validation.
 * This class implements ValidatorConstraintInterface to provide CUID validation functionality.
 *
 * The validator allows undefined/null values to pass validation, which is useful for optional fields.
 * For non-null/undefined values, it validates if the string is a valid CUID.
 *
 * @example
 * ```typescript
 * class MyDto {
 *   @Validate(IsCuidConstraint)
 *   productId: string;
 * }
 * ```
 *
 * @implements {ValidatorConstraintInterface}
 */
@ValidatorConstraint({ async: false })
export class IsCuidConstraint implements ValidatorConstraintInterface {
  validate(cuidValue: string): boolean {
    // If the property is not sent in the request (undefined or null), skip validation
    if (cuidValue === undefined || cuidValue === null) return true;

    // Otherwise, validate the value as a CUID
    return isCuid(cuidValue);
  }

  defaultMessage(): string {
    return 'productId must be a valid CUID';
  }
}

/**
 * Decorator that validates if a property contains a valid CUID.
 * CUID (Collision-resistant Unique IDentifier) is a secure unique identifier algorithm.
 *
 * @param validationOptions - Optional validation constraints to customize the validation behavior
 * @returns A PropertyDecorator function that registers the CUID validation rules
 *
 * @example
 * ```typescript
 * class Example {
 *   @IsCuid()
 *   public id: string;
 * }
 * ```
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
