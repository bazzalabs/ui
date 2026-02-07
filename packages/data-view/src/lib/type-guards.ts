// @bazza-ui/data-view — Type Guards

import type { Column, ColumnDataType, FilterModel } from '../core/types.js'

// ============================================================================
// Column Type Guards
// ============================================================================

/**
 * Type guard to check if a column is of a specific type.
 * Preserves the TData generic while narrowing the column type.
 */
export function isColumnType<TData, TType extends ColumnDataType>(
  column: Column<TData>,
  type: TType,
): column is Column<TData, TType> {
  return column.type === type
}

/** Type guard for text columns */
export function isTextColumn<TData>(
  column: Column<TData>,
): column is Column<TData, 'text'> {
  return column.type === 'text'
}

/** Type guard for option columns */
export function isOptionColumn<TData>(
  column: Column<TData>,
): column is Column<TData, 'option'> {
  return column.type === 'option'
}

/** Type guard for multiOption columns */
export function isMultiOptionColumn<TData>(
  column: Column<TData>,
): column is Column<TData, 'multiOption'> {
  return column.type === 'multiOption'
}

/** Type guard for option-based (option or multiOption) columns */
export function isOptionBasedColumn<TData>(
  column: Column<TData>,
): column is Column<TData, 'option'> | Column<TData, 'multiOption'> {
  return column.type === 'option' || column.type === 'multiOption'
}

/** Type guard for date columns */
export function isDateColumn<TData>(
  column: Column<TData>,
): column is Column<TData, 'date'> {
  return column.type === 'date'
}

/** Type guard for number columns */
export function isNumberColumn<TData>(
  column: Column<TData>,
): column is Column<TData, 'number'> {
  return column.type === 'number'
}

/** Type guard for bigint columns */
export function isBigIntColumn<TData>(
  column: Column<TData>,
): column is Column<TData, 'bigint'> {
  return column.type === 'bigint'
}

/** Type guard for numeric (number or bigint) columns */
export function isNumericColumn<TData>(
  column: Column<TData>,
): column is Column<TData, 'number'> | Column<TData, 'bigint'> {
  return column.type === 'number' || column.type === 'bigint'
}

/** Type guard for boolean columns */
export function isBooleanColumn<TData>(
  column: Column<TData>,
): column is Column<TData, 'boolean'> {
  return column.type === 'boolean'
}

// ============================================================================
// Filter Type Guards
// ============================================================================

/**
 * Type guard to check if a filter is of a specific type.
 */
export function isFilterType<TType extends ColumnDataType>(
  filter: FilterModel,
  type: TType,
): filter is FilterModel<TType> {
  return filter.type === type
}

/** Type guard for text filters */
export function isTextFilter(
  filter: FilterModel,
): filter is FilterModel<'text'> {
  return filter.type === 'text'
}

/** Type guard for option filters */
export function isOptionFilter(
  filter: FilterModel,
): filter is FilterModel<'option'> {
  return filter.type === 'option'
}

/** Type guard for multiOption filters */
export function isMultiOptionFilter(
  filter: FilterModel,
): filter is FilterModel<'multiOption'> {
  return filter.type === 'multiOption'
}

/** Type guard for option-based (option or multiOption) filters */
export function isOptionBasedFilter(
  filter: FilterModel,
): filter is FilterModel<'option'> | FilterModel<'multiOption'> {
  return filter.type === 'option' || filter.type === 'multiOption'
}

/** Type guard for date filters */
export function isDateFilter(
  filter: FilterModel,
): filter is FilterModel<'date'> {
  return filter.type === 'date'
}

/** Type guard for number filters */
export function isNumberFilter(
  filter: FilterModel,
): filter is FilterModel<'number'> {
  return filter.type === 'number'
}

/** Type guard for bigint filters */
export function isBigIntFilter(
  filter: FilterModel,
): filter is FilterModel<'bigint'> {
  return filter.type === 'bigint'
}

/** Type guard for numeric (number or bigint) filters */
export function isNumericFilter(
  filter: FilterModel,
): filter is FilterModel<'number'> | FilterModel<'bigint'> {
  return filter.type === 'number' || filter.type === 'bigint'
}

/** Type guard for boolean filters */
export function isBooleanFilter(
  filter: FilterModel,
): filter is FilterModel<'boolean'> {
  return filter.type === 'boolean'
}
