import { isBefore } from 'date-fns'
import type { Column, ColumnOption, FiltersState } from '../core/types.js'
import {
  booleanFilterFn,
  dateFilterFn,
  multiOptionFilterFn,
  numberFilterFn,
  optionFilterFn,
  textFilterFn,
} from './filter-fns.js'

export function getColumn<TData>(columns: Column<TData>[], id: string) {
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

export function isMinMaxTuple(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
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

export function filterRow(row: any, filters: FiltersState) {
  for (const filter of filters) {
    const cell = row[filter.columnId]

    if (filter.type === 'text') {
      if (!textFilterFn(cell, filter)) {
        return false
      }
    } else if (filter.type === 'number') {
      if (!numberFilterFn(cell, filter)) {
        return false
      }
    } else if (filter.type === 'date') {
      if (!dateFilterFn(cell, filter)) {
        return false
      }
    } else if (filter.type === 'boolean') {
      if (!booleanFilterFn(cell, filter)) {
        return false
      }
    } else if (filter.type === 'option') {
      if (!optionFilterFn(cell, filter)) {
        return false
      }
    } else if (filter.type === 'multiOption') {
      if (!multiOptionFilterFn(cell, filter)) {
        return false
      }
    } else {
      throw new Error(`Unknown filter type: ${filter.type}`)
    }
  }

  return true
}

export function filterData<TData>(
  data: TData[],
  filters: FiltersState,
): TData[] {
  return data.filter((row) => filterRow(row, filters))
}
