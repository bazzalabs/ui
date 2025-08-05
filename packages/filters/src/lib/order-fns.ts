import type {
  ColumnOption,
  OrderDirection,
  TBuiltInOrderFn,
  TBuiltInOrderFnName,
  TCustomOrderFn,
  TOrderFnArg,
  TOrderFns,
} from '../core/types.js'

/**
 * Built-in order function that sorts column options by their count property.
 * Treats undefined counts as 0.
 *
 * @param a - First column option to compare
 * @param b - Second column option to compare
 * @param direction - Sort direction ('asc' for ascending, 'desc' for descending)
 * @returns Negative number if a should come before b, positive if after, 0 if equal
 *
 * @example
 * ```typescript
 * // Sort by count ascending
 * const result = count(
 *   { value: 'a', label: 'A', count: 5 },
 *   { value: 'b', label: 'B', count: 3 },
 *   'asc'
 * ) // Returns -2 (3 - 5)
 * ```
 */
function count(a: ColumnOption, b: ColumnOption, direction: OrderDirection) {
  const x = a.count ?? 0
  const y = b.count ?? 0

  return direction === 'asc' ? x - y : y - x
}

/**
 * Built-in order function that sorts column options by their label property.
 * Performs case-insensitive comparison using localeCompare.
 *
 * @param a - First column option to compare
 * @param b - Second column option to compare
 * @param direction - Sort direction ('asc' for ascending, 'desc' for descending)
 * @returns Negative number if a should come before b, positive if after, 0 if equal
 *
 * @example
 * ```typescript
 * // Sort by label ascending (case-insensitive)
 * const result = label(
 *   { value: 'a', label: 'Apple' },
 *   { value: 'b', label: 'banana' },
 *   'asc'
 * ) // Returns negative number ('apple' < 'banana')
 * ```
 */
function label(a: ColumnOption, b: ColumnOption, direction: OrderDirection) {
  const x = a.label.toLowerCase()
  const y = b.label.toLowerCase()

  return direction === 'asc' ? x.localeCompare(y) : y.localeCompare(x)
}

/**
 * Collection of built-in order functions available for sorting column options.
 * Each function takes two ColumnOptions and an OrderDirection, returning a comparison result.
 *
 * @example
 * ```typescript
 * // Use built-in count function
 * const sortedOptions = options.sort((a, b) => orderFns.count(a, b, 'desc'))
 * ```
 */
export const orderFns = {
  count,
  label,
} as const satisfies Record<string, TBuiltInOrderFn>

/**
 * Applies multiple order functions to sort an array of column options.
 * Functions are applied in sequence - if the first comparison returns 0 (equal),
 * the next function is tried, and so on. This mimics SQL's ORDER BY behavior
 * with multiple columns.
 *
 * @param orderFns - Array of order functions to apply in sequence
 * @param options - Array of column options to sort
 * @returns New sorted array of column options
 *
 * @example
 * ```typescript
 * // Sort by count descending, then by label ascending for ties
 * const orderFunctions = [
 *   (a, b) => orderFns.count(a, b, 'desc'),
 *   (a, b) => orderFns.label(a, b, 'asc')
 * ]
 * const sorted = applyOrderFns(orderFunctions, options)
 * ```
 */
export function applyOrderFns(
  orderFns: TOrderFns,
  options: ColumnOption[],
): ColumnOption[] {
  return options.sort((a, b) => {
    for (const orderFn of orderFns) {
      const result = orderFn(a, b)
      if (result !== 0) {
        return result // First non-zero result wins
      }
    }
    return 0 // All comparisons were equal
  })
}

// Type guards

/**
 * Type guard that checks if a value is a valid built-in order function name.
 *
 * @param value - Value to check
 * @returns True if value is a valid built-in order function name
 *
 * @example
 * ```typescript
 * if (isBuiltInOrderFnName('count')) {
 *   // value is guaranteed to be 'count' | 'label'
 * }
 * ```
 */
export function isBuiltInOrderFnName(
  value: unknown,
): value is TBuiltInOrderFnName {
  return typeof value === 'string' && value in orderFns
}

/**
 * Type guard that checks if a value is a valid order direction.
 *
 * @param value - Value to check
 * @returns True if value is 'asc' or 'desc'
 *
 * @example
 * ```typescript
 * if (isOrderDirection(userInput)) {
 *   // userInput is guaranteed to be 'asc' | 'desc'
 * }
 * ```
 */
export function isOrderDirection(value: unknown): value is OrderDirection {
  return typeof value === 'string' && (value === 'asc' || value === 'desc')
}

/**
 * Type guard that checks if a value is a valid custom order function.
 * A valid custom order function must be a function that accepts exactly 2 parameters.
 *
 * @param value - Value to check
 * @returns True if value is a function with exactly 2 parameters
 *
 * @example
 * ```typescript
 * const customFn = (a: ColumnOption, b: ColumnOption) => a.value.localeCompare(b.value)
 * if (isCustomOrderFn(customFn)) {
 *   // customFn is guaranteed to be TCustomOrderFn
 * }
 * ```
 */
export function isCustomOrderFn(value: unknown): value is TCustomOrderFn {
  return typeof value === 'function' && value.length === 2
}

/**
 * Type guard that checks if a value is a valid built-in order function tuple.
 * A valid tuple consists of [functionName, direction] where functionName is a built-in
 * function name and direction is 'asc' or 'desc'.
 *
 * @param value - Value to check
 * @returns True if value is a valid [TBuiltInOrderFnName, OrderDirection] tuple
 *
 * @example
 * ```typescript
 * if (isBuiltInOrderFnTuple(['count', 'asc'])) {
 *   // value is guaranteed to be ['count' | 'label', 'asc' | 'desc']
 * }
 * ```
 */
export function isBuiltInOrderFnTuple(
  value: unknown,
): value is [TBuiltInOrderFnName, OrderDirection] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    isBuiltInOrderFnName(value[0]) &&
    isOrderDirection(value[1])
  )
}

/**
 * Type guard that checks if a value is any valid order function argument.
 * Accepts either a built-in order function tuple or a custom order function.
 *
 * @param value - Value to check
 * @returns True if value is a valid order function argument
 *
 * @example
 * ```typescript
 * // Valid arguments:
 * isOrderFnArg(['count', 'asc']) // true - built-in tuple
 * isOrderFnArg((a, b) => a.value.localeCompare(b.value)) // true - custom function
 * isOrderFnArg('invalid') // false
 * ```
 */
export function isOrderFnArg(value: unknown): value is TOrderFnArg {
  return isBuiltInOrderFnTuple(value) || isCustomOrderFn(value)
}
