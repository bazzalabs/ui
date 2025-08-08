import { getValidNumber } from './helpers.js'

export function intersection<T>(a: T[], b: T[]): T[] {
  return a.filter((x) => b.includes(x))
}

/**
 * Computes a stable hash string for any value using deep inspection.
 * This function recursively builds a string for primitives, arrays, and objects.
 * It uses a cache (WeakMap) to avoid rehashing the same object twice, which is
 * particularly beneficial if an object appears in multiple places.
 */
function deepHash(value: any, cache = new WeakMap<object, string>()): string {
  // Handle primitives and null/undefined.
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  const type = typeof value
  if (type === 'number' || type === 'boolean' || type === 'string') {
    return `${type}:${value.toString()}`
  }
  if (type === 'function') {
    // Note: using toString for functions.
    return `function:${value.toString()}`
  }

  // For objects and arrays, use caching to avoid repeated work.
  if (type === 'object') {
    // If we’ve seen this object before, return the cached hash.
    if (cache.has(value)) {
      return cache.get(value)!
    }
    let hash: string
    if (Array.isArray(value)) {
      // Compute hash for each element in order.
      hash = `array:[${value.map((v) => deepHash(v, cache)).join(',')}]`
    } else {
      // For objects, sort keys to ensure the representation is stable.
      const keys = Object.keys(value).sort()
      const props = keys
        .map((k) => `${k}:${deepHash(value[k], cache)}`)
        .join(',')
      hash = `object:{${props}}`
    }
    cache.set(value, hash)
    return hash
  }

  // Fallback if no case matched.
  return `${type}:${value.toString()}`
}

/**
 * Performs deep equality check for any two values.
 * This recursively checks primitives, arrays, and plain objects.
 */
function deepEqual(a: any, b: any): boolean {
  // Check strict equality first.
  if (a === b) return true
  // If types differ, they’re not equal.
  if (typeof a !== typeof b) return false
  if (a === null || b === null || a === undefined || b === undefined)
    return false

  // Check arrays.
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }

  // Check objects.
  if (typeof a === 'object') {
    if (typeof b !== 'object') return false
    const aKeys = Object.keys(a).sort()
    const bKeys = Object.keys(b).sort()
    if (aKeys.length !== bKeys.length) return false
    for (let i = 0; i < aKeys.length; i++) {
      if (aKeys[i] !== bKeys[i]) return false
      if (!deepEqual(a[aKeys[i]!], b[bKeys[i]!])) return false
    }
    return true
  }

  // For any other types (should be primitives by now), use strict equality.
  return false
}

/**
 * Returns a new array containing only the unique values from the input array.
 * Uniqueness is determined by deep equality.
 *
 * @param arr - The array of values to be filtered.
 * @returns A new array with duplicates removed.
 */
export function uniq<T>(arr: T[]): T[] {
  // Use a Map where key is the deep hash and value is an array of items sharing the same hash.
  const seen = new Map<string, T[]>()
  const result: T[] = []

  for (const item of arr) {
    const hash = deepHash(item)
    if (seen.has(hash)) {
      // There is a potential duplicate; check the stored items with the same hash.
      const itemsWithHash = seen.get(hash)!
      let duplicateFound = false
      for (const existing of itemsWithHash) {
        if (deepEqual(existing, item)) {
          duplicateFound = true
          break
        }
      }
      if (!duplicateFound) {
        itemsWithHash.push(item)
        result.push(item)
      }
    } else {
      // First time this hash appears.
      seen.set(hash, [item])
      result.push(item)
    }
  }

  return result
}

export function take<T>(a: T[], n: number): T[] {
  return a.slice(0, n)
}

export function flatten<T>(a: T[][]): T[] {
  return a.flat()
}

export function addUniq<T>(arr: T[], values: T[]): T[] {
  return uniq([...arr, ...values])
}

export function removeUniq<T>(arr: T[], values: T[]): T[] {
  return arr.filter((v) => !values.includes(v))
}

export function isAnyOf<T>(value: T, values: T[]): boolean {
  return values.includes(value)
}

/**
 * Get the maximum value from an array of numbers.
 * Ignores invalid entries (null/undefined/NaN or non-numbers) via `getValidNumber`,
 * so it’s safe with `noUncheckedIndexedAccess` and sparse arrays.
 *
 * @param values - Array of numbers (may contain holes)
 * @returns The largest valid number, or -Infinity if none are valid.
 * @example
 * max([1, 3, 2]) // => 3
 * max([])        // => -Infinity
 */
export function max(values: readonly number[]): number {
  let found = false
  let m = Number.NEGATIVE_INFINITY

  for (let i = 0; i < values.length; i++) {
    const v = getValidNumber(values[i] as any)
    if (v !== undefined) {
      if (v > m) m = v
      found = true
    }
  }

  return found ? m : Number.NEGATIVE_INFINITY
}

/**
 * Get the minimum value from an array of numbers.
 * Ignores invalid entries (null/undefined/NaN or non-numbers) via `getValidNumber`,
 * so it’s safe with `noUncheckedIndexedAccess` and sparse arrays.
 *
 * @param values - Array of numbers (may contain holes)
 * @returns The smallest valid number, or Infinity if none are valid.
 * @example
 * min([1, 3, 2]) // => 1
 * min([])        // => Infinity
 */
export function min(values: readonly number[]): number {
  let found = false
  let m = Number.POSITIVE_INFINITY

  for (let i = 0; i < values.length; i++) {
    const v = getValidNumber(values[i] as any)
    if (v !== undefined) {
      if (v < m) m = v
      found = true
    }
  }

  return found ? m : Number.POSITIVE_INFINITY
}

/**
 * Get both the minimum and maximum values from an array of numbers in a single pass.
 * Ignores invalid entries via `getValidNumber`, making it safe with `noUncheckedIndexedAccess`
 * and efficient for sparse/large arrays.
 *
 * @param values - Array of numbers (may contain holes)
 * @returns A tuple [min, max], or [Infinity, -Infinity] if none are valid.
 * @example
 * minMax([3, -2, 7, 0]) // => [-2, 7]
 * minMax([])            // => [Infinity, -Infinity]
 */
export function minMax(values: readonly number[]): [number, number] {
  let found = false
  let minVal = Number.POSITIVE_INFINITY
  let maxVal = Number.NEGATIVE_INFINITY

  for (let i = 0; i < values.length; i++) {
    const v = getValidNumber(values[i] as any)
    if (v !== undefined) {
      if (v < minVal) minVal = v
      if (v > maxVal) maxVal = v
      found = true
    }
  }

  return found
    ? [minVal, maxVal]
    : [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]
}
