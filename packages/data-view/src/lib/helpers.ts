// @bazza-ui/data-view — Helper Utilities

import { isBefore } from 'date-fns'
import type { OperatorSet } from '../core/operator-set.js'
import { defaultOperatorSets } from '../core/operator-sets.js'
import type {
  BuiltInColumnDataType,
  ColumnOption,
  FilterModel,
  FiltersState,
} from '../core/types.js'

export function getColumn<TData>(columns: Array<{ id: string }>, id: string) {
  const column = columns.find((c) => c.id === id)

  if (!column) {
    throw new Error(`Column with id ${id} not found`)
  }

  return column
}

export function createNumberFilterValue(
  values: number[] | undefined,
): number[] {
  if (!values || values.length === 0 || values[0] === undefined) return []
  if (values.length === 1) return [values[0]]
  if (values.length === 2) return createNumberRange(values)
  return [values[0], values[1]!]
}

export function createBigIntFilterValue(
  values: bigint[] | undefined,
): bigint[] {
  if (!values || values.length === 0 || values[0] === undefined) return []
  if (values.length === 1) return [values[0]]
  if (values.length === 2) return createBigIntRange(values)
  throw new Error('Cannot create bigint filter value from more than 2 values')
}

export function createDateFilterValue(
  values: [Date, Date] | [Date] | [] | undefined,
) {
  if (!values || values.length === 0) return []
  if (values.length === 1) return [values[0]]
  if (values.length === 2) return createDateRange(values)
  throw new Error('Cannot create date filter value from more than 2 values')
}

export function createDateRange(values: [Date, Date]) {
  const [a, b] = values
  const [min, max] = isBefore(a, b) ? [a, b] : [b, a]

  return [min, max]
}

export function createNumberRange(values: number[] | undefined) {
  let a = 0
  let b = 0

  if (!values || values.length === 0) return [a, b]
  if (values.length === 1) {
    a = values[0]!
  } else {
    a = values[0]!
    b = values[1]!
  }

  const [min, max] = a < b ? [a, b] : [b, a]

  return [min, max]
}

export function createBigIntRange(values: bigint[] | undefined) {
  let a = 0n
  let b = 0n

  if (!values || values.length === 0) return [a, b]
  if (values.length === 1) {
    a = values[0]!
  } else {
    a = values[0]!
    b = values[1]!
  }

  const [min, max] = a < b ? [a, b] : [b, a]

  return [min, max]
}

export function isColumnOption(value: unknown): value is ColumnOption {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    'label' in value
  )
}

export function isColumnOptionArray(value: unknown): value is ColumnOption[] {
  return Array.isArray(value) && value.every(isColumnOption)
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

export function isColumnOptionMap(
  value: unknown,
): value is Map<string, number> {
  if (!(value instanceof Map)) {
    return false
  }
  for (const key of value.keys()) {
    if (typeof key !== 'string') {
      return false
    }
  }
  for (const val of value.values()) {
    if (typeof val !== 'number') {
      return false
    }
  }
  return true
}

export function isMinMaxTuple<T extends number | bigint>(
  value: unknown,
  kind: 'number' | 'bigint',
): value is [T, T] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === kind &&
    typeof value[1] === kind
  )
}

export function getValidNumber(value: any): number | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value !== 'number') return undefined
  if (Number.isNaN(value)) return undefined

  return value // This includes Infinity and -Infinity, which are valid
}

export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !Number.isNaN(value)
}

export function getValidBigInt(value: any): bigint | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'bigint') return value
  if (typeof value === 'string' || typeof value === 'number') {
    try {
      return BigInt(value)
    } catch {
      return undefined
    }
  }
  return undefined
}

// ── Filter Row / Filter Data ────────────────────────────────

/**
 * Resolves an OperatorSet for a given filter.
 *
 * If a custom `getOperatorSetForFilter` is provided, it is used.
 * Otherwise, falls back to `defaultOperatorSets[filter.type]`.
 */
function resolveOperatorSet(
  filter: FilterModel,
  getOperatorSetForFilter?: (filter: FilterModel) => OperatorSet | undefined,
): OperatorSet | undefined {
  if (getOperatorSetForFilter) {
    const set = getOperatorSetForFilter(filter)
    if (set) return set
  }
  return defaultOperatorSets[filter.type as BuiltInColumnDataType]
}

/**
 * Tests whether a single row passes all active filters.
 *
 * Uses `operatorSet.get(filter.operator).match()` — no per-type switch.
 * If an operator has no `match` function, the filter is considered passing (true).
 *
 * @param row - The data row (record with column IDs as keys).
 * @param filters - The active filters to test against.
 * @param getOperatorSetForFilter - Optional resolver for custom operator sets per filter.
 */
export function filterRow(
  row: any,
  filters: FiltersState,
  getOperatorSetForFilter?: (filter: FilterModel) => OperatorSet | undefined,
): boolean {
  for (const filter of filters) {
    const operatorSet = resolveOperatorSet(filter, getOperatorSetForFilter)

    if (!operatorSet) {
      throw new Error(
        `[data-view] No operator set found for filter type "${filter.type}". ` +
          'Provide a getOperatorSetForFilter function or use a built-in column type.',
      )
    }

    if (!operatorSet.has(filter.operator)) {
      throw new Error(
        `[data-view] Operator "${filter.operator}" not found in operator set for filter type "${filter.type}".`,
      )
    }

    const opDef = operatorSet.get(filter.operator)

    // If no match function is defined, the filter passes by default
    if (!opDef.match) continue

    const cellValue = row[filter.columnId]

    if (!opDef.match(cellValue, filter.values)) {
      return false
    }
  }

  return true
}

/**
 * Filters an array of data rows, keeping only those that pass all active filters.
 *
 * @param data - The data array to filter.
 * @param filters - The active filters to apply.
 * @param getOperatorSetForFilter - Optional resolver for custom operator sets per filter.
 */
export function filterData<TData>(
  data: TData[],
  filters: FiltersState,
  getOperatorSetForFilter?: (filter: FilterModel) => OperatorSet | undefined,
): TData[] {
  if (filters.length === 0) return data
  return data.filter((row) => filterRow(row, filters, getOperatorSetForFilter))
}
