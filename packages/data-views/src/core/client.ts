// @bazza-ui/data-views — Client-side Data Processing
// Accessor-aware filtering and sorting for client strategy.

import {
  countConditions,
  type FilterNode,
  type FiltersState,
  isCondition,
} from './filter-tree.js'
import type { OperatorSet } from './operator-set.js'
import { getOperatorSet } from './operators.js'
import type { ColumnDataType, ColumnSort, SortState } from './types.js'

export type ClientColumn<TData> = {
  id: string
  type: ColumnDataType
  accessor: (row: TData) => unknown
  operators?: OperatorSet
  columnType?: { operators: OperatorSet }
}

type ProcessDataState = {
  filters: FiltersState
  sort: SortState
}

// ── Value Comparison ────────────────────────────────────────

/**
 * Compares two unknown values for sorting.
 * Handles: string, number, bigint, Date, boolean, arrays (by length),
 * and falls back to string comparison.
 *
 * `null` / `undefined` values sort to the end (after all real values).
 */
export function compareValues(a: unknown, b: unknown): number {
  // Nullish values sort last
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1

  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b)
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }

  if (typeof a === 'bigint' && typeof b === 'bigint') {
    return a < b ? -1 : a > b ? 1 : 0
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime()
  }

  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return (a ? 1 : 0) - (b ? 1 : 0)
  }

  // Arrays: compare by length
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length - b.length
  }

  // Fallback: string comparison
  return String(a).localeCompare(String(b))
}

// ── Accessor-Aware Filtering ────────────────────────────────

/**
 * Tests whether a single filter tree node passes for a row, using column
 * accessors to extract cell values instead of direct property access.
 *
 * Unknown columns, unknown operators, and operators without `match` functions
 * are treated as passing conditions.
 */
export function evaluateFilterNode<TData>(
  row: TData,
  node: FilterNode,
  columns: ClientColumn<TData>[],
): boolean {
  if (isCondition(node)) {
    const column = columns.find((c) => c.id === node.columnId)
    if (!column) return true

    const operatorSet = getOperatorSet(column)

    if (!operatorSet.has(node.operator)) return true

    const opDef = operatorSet.get(node.operator)
    if (!opDef.match) return true

    const cellValue = column.accessor(row)

    return opDef.match(cellValue, node.values)
  }

  if (node.op === 'and') {
    return node.children.every((child) =>
      evaluateFilterNode(row, child, columns),
    )
  }

  return node.children.length === 0
    ? true
    : node.children.some((child) => evaluateFilterNode(row, child, columns))
}

/**
 * Tests whether a single row passes the active filter tree, using column
 * accessors to extract cell values instead of direct property access.
 *
 * This is the accessor-aware counterpart to `filterRow()` (which uses
 * `row[filter.columnId]`). Use this when your data rows have nested
 * structures that require accessor functions to extract filterable values.
 */
export function filterRowByColumns<TData>(
  row: TData,
  columns: ClientColumn<TData>[],
  filters: FiltersState,
): boolean {
  return evaluateFilterNode(row, filters, columns)
}

/**
 * Filters an array of data rows using column accessors to extract cell values.
 *
 * This is the accessor-aware counterpart to `filterData()`.
 * Returns the original data array when there are no active filters.
 */
export function filterDataByColumns<TData>(
  data: TData[],
  columns: ClientColumn<TData>[],
  filters: FiltersState,
): TData[] {
  if (countConditions(filters) === 0) return data
  return data.filter((row) => filterRowByColumns(row, columns, filters))
}

// ── Accessor-Aware Sorting ──────────────────────────────────

/**
 * Sorts an array of data rows using column accessors to extract comparable values.
 *
 * Only processes `ColumnSort` rules (type: 'column'). `CustomSort` rules are
 * ignored — they represent application-level sort logic that must be handled
 * by the consumer.
 *
 * Returns the original data array when there are no column sort rules.
 */
export function sortDataByColumns<TData>(
  data: TData[],
  columns: ClientColumn<TData>[],
  sort: SortState,
): TData[] {
  const columnSorts = sort.filter((r): r is ColumnSort => r.type === 'column')

  if (columnSorts.length === 0) return data

  return [...data].sort((a, b) => {
    for (const rule of columnSorts) {
      const column = columns.find((c) => c.id === rule.columnId)
      if (!column) continue

      const aVal = column.accessor(a)
      const bVal = column.accessor(b)
      const dir = rule.direction === 'asc' ? 1 : -1
      const cmp = compareValues(aVal, bVal)

      if (cmp !== 0) return cmp * dir
    }
    return 0
  })
}

// ── Combined Processing ─────────────────────────────────────

/**
 * Applies both filtering and sorting to a data array (filter first, then sort).
 *
 * This is the convenience function used internally by `useDataView` when
 * `strategy` is `'client'`.
 */
export function processData<TData>(
  data: TData[],
  columns: ClientColumn<TData>[],
  view: ProcessDataState,
): TData[] {
  const filtered = filterDataByColumns(data, columns, view.filters)
  return sortDataByColumns(filtered, columns, view.sort)
}
