/**
 * Utility class providing safe object manipulation methods.
 *
 * @class ObjectManipulator
 *
 * @description
 * A collection of static methods for safely manipulating JavaScript/TypeScript objects.
 * This class provides utilities for common object operations like property deletion
 * and property exclusion while maintaining type safety.
 *
 * @remarks
 * - All methods are static and do not require class instantiation
 * - Methods are designed to be type-safe and provide TypeScript support
 * - Operations that could be unsafe are handled with appropriate warnings
 *
 * @example
 * ```typescript
 * // Safe property deletion
 * const user = { name: "John", age: 30 };
 * ObjectManipulator.safeDelete(user, "age");
 *
 * // Property exclusion
 * const userData = { id: 1, name: "John", password: "secret" };
 * const publicData = ObjectManipulator.exclude(userData, ["password"]);
 * ```
 *
 * @public
 */
export class ObjectManipulator {
  /**
   * Safely removes a property from an object, warning if the property does not exist.
   *
   * @template T - The object type
   * @template K - The key type (must be a key of T)
   * @param obj - The object to modify
   * @param key - The key to remove from the object
   *
   * @remarks
   * This method will:
   * - Check if the property exists before attempting deletion
   * - Log a warning if the property doesn't exist
   * - Delete the property if it exists
   *
   * @example
   * ```typescript
   * const user = { name: "John", age: 30 };
   * ObjectManipulator.safeDelete(user, "age"); // removes age
   * ObjectManipulator.safeDelete(user, "email"); // logs warning, email doesn't exist
   * ```
   */
  static safeDelete<T extends object, K extends keyof T>(obj: T, key: K): void {
    if (!(key in obj)) {
      console.warn(`Property ${String(key)} does not exist on the object.`);
      return;
    }

    delete obj[key];
  }

  /**
   * Excludes specified properties from an object.
   *
   * @template T - The type of the input object
   * @param obj - The source object from which to exclude properties
   * @param keys - Array of keys to exclude from the object
   * @returns A new object with the specified keys excluded
   *
   * @example
   * const user = { id: 1, name: 'John', password: '123' };
   * const safeUser = ObjectManipulator.exclude(user, ['password']);
   * // Result: { id: 1, name: 'John' }
   *
   * @remarks
   * - The function creates a new object and does not modify the original
   * - The returned object is typed as Partial<T> since properties are removed
   * - Keys that don't exist in the original object are ignored
   */
  static exclude<T extends object>(obj: T, keys: (keyof T)[]): Partial<T> {
    return Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key as keyof T))) as Partial<T>;
  }
}
