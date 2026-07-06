// @bazza-ui/data-views — Option Ordering Functions

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
 */
function count(a: ColumnOption, b: ColumnOption, direction: OrderDirection) {
  const x = a.count ?? 0
  const y = b.count ?? 0

  return direction === 'asc' ? x - y : y - x
}

/**
 * Built-in order function that sorts column options by their label property.
 * Performs case-insensitive comparison using localeCompare.
 */
function label(a: ColumnOption, b: ColumnOption, direction: OrderDirection) {
  const x = a.label.toLowerCase()
  const y = b.label.toLowerCase()

  return direction === 'asc' ? x.localeCompare(y) : y.localeCompare(x)
}

/**
 * Collection of built-in order functions available for sorting column options.
 * Each function takes two ColumnOptions and an OrderDirection, returning a comparison result.
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

export function isBuiltInOrderFnName(
  value: unknown,
): value is TBuiltInOrderFnName {
  return typeof value === 'string' && value in orderFns
}

export function isOrderDirection(value: unknown): value is OrderDirection {
  return typeof value === 'string' && (value === 'asc' || value === 'desc')
}

export function isCustomOrderFn(value: unknown): value is TCustomOrderFn {
  return typeof value === 'function' && value.length === 2
}

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

export function isOrderFnArg(value: unknown): value is TOrderFnArg {
  return isBuiltInOrderFnTuple(value) || isCustomOrderFn(value)
}
