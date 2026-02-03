/**
 * Type for custom item equality comparison functions.
 * Used to compare object values in Select and Combobox components.
 */
export type ItemEqualityComparer<Value = unknown> = (
  itemValue: Value,
  value: Value,
) => boolean

/**
 * Default equality comparer using Object.is.
 * Handles primitives and object reference equality.
 */
export const defaultItemEquality: ItemEqualityComparer = (item, value) =>
  Object.is(item, value)

/**
 * Compare two items for equality using a custom comparer.
 * Handles null/undefined values separately using Object.is.
 */
export function compareItemEquality<Value>(
  item: Value,
  value: Value,
  comparer: ItemEqualityComparer<Value>,
): boolean {
  // Handle null/undefined with Object.is for consistent behavior
  if (item == null || value == null) {
    return Object.is(item, value)
  }
  return comparer(item, value)
}

/**
 * Check if a collection includes a specific value using custom equality.
 */
export function itemIncludes<Value>(
  collection: readonly Value[] | undefined | null,
  value: Value,
  comparer: ItemEqualityComparer<Value>,
): boolean {
  if (!collection || collection.length === 0) {
    return false
  }
  return collection.some((item) => {
    if (item === undefined) {
      return false
    }
    return compareItemEquality(item, value, comparer)
  })
}

/**
 * Find the index of a value in a collection using custom equality.
 * Returns -1 if not found.
 */
export function findItemIndex<Value>(
  collection: readonly Value[] | undefined | null,
  value: Value,
  comparer: ItemEqualityComparer<Value>,
): number {
  if (!collection || collection.length === 0) {
    return -1
  }
  return collection.findIndex((item) => {
    if (item === undefined) {
      return false
    }
    return compareItemEquality(item, value, comparer)
  })
}

/**
 * Remove a value from a collection using custom equality.
 * Returns a new array without the matching item.
 */
export function removeItem<Value>(
  collection: readonly Value[],
  value: Value,
  comparer: ItemEqualityComparer<Value>,
): Value[] {
  return collection.filter(
    (item) => !compareItemEquality(item, value, comparer),
  )
}
