// @bazza-ui/data-view — Filter Operations
// Pure filter state transition functions using OperatorSet.

import { addUniq, removeUniq, uniq } from '../lib/array.js'
import {
  createBigIntFilterValue,
  createDateFilterValue,
  createNumberFilterValue,
} from '../lib/helpers.js'
import { determineNewOperator, getOperatorSet } from './operators.js'
import type {
  Column,
  ColumnDataType,
  FilterModel,
  FiltersState,
  OptionBasedColumnDataType,
} from './types.js'

/**
 * Pure filter state operations.
 *
 * Every method takes the current `FiltersState` (and relevant arguments) and
 * returns a **new** `FiltersState` — no mutations.
 */
export const filterOperations = {
  /**
   * Adds one or more values to an option/multiOption filter.
   * Creates the filter if it doesn't exist yet.
   * Auto-transitions the operator via `determineNewOperator`.
   */
  addFilterValue<TData, TType extends OptionBasedColumnDataType>(
    filters: FiltersState,
    column: Column<TData, TType>,
    values: FilterModel<TType>['values'],
  ): FiltersState {
    if (column.type !== 'option' && column.type !== 'multiOption') {
      throw new Error(
        '[data-view] addFilterValue() is only supported for option and multiOption columns',
      )
    }

    const operatorSet = getOperatorSet(column)
    const filter = filters.find((f) => f.columnId === column.id)
    const isColumnFiltered = filter && filter.values.length > 0

    if (!isColumnFiltered) {
      const target = values.length > 1 ? 'multiple' : 'single'
      return [
        ...filters,
        {
          columnId: column.id,
          type: column.type,
          operator: operatorSet.getDefault(target).id,
          values,
        },
      ]
    }

    const oldValues = filter.values
    const newValues = addUniq(filter.values, values)
    const newOperator = determineNewOperator(
      operatorSet,
      oldValues,
      newValues,
      filter.operator,
    )

    if (newValues.length === 0) {
      return filters.filter((f) => f.columnId !== column.id)
    }

    return filters.map((f) =>
      f.columnId === column.id
        ? {
            columnId: column.id,
            type: column.type,
            operator: newOperator,
            values: newValues,
          }
        : f,
    )
  },

  /**
   * Removes one or more values from an option/multiOption filter.
   * Removes the filter entirely if no values remain.
   * Auto-transitions the operator via `determineNewOperator`.
   */
  removeFilterValue<TData, TType extends OptionBasedColumnDataType>(
    filters: FiltersState,
    column: Column<TData, TType>,
    value: FilterModel<TType>['values'],
  ): FiltersState {
    if (column.type !== 'option' && column.type !== 'multiOption') {
      throw new Error(
        '[data-view] removeFilterValue() is only supported for option and multiOption columns',
      )
    }

    const filter = filters.find((f) => f.columnId === column.id)
    const isColumnFiltered = filter && filter.values.length > 0

    if (!isColumnFiltered) {
      return filters
    }

    const operatorSet = getOperatorSet(column)
    const oldValues = filter.values
    const newValues = removeUniq(filter.values, value)
    const newOperator = determineNewOperator(
      operatorSet,
      oldValues,
      newValues,
      filter.operator,
    )

    if (newValues.length === 0) {
      return filters.filter((f) => f.columnId !== column.id)
    }

    return filters.map((f) =>
      f.columnId === column.id
        ? {
            columnId: column.id,
            type: column.type,
            operator: newOperator,
            values: newValues,
          }
        : f,
    )
  },

  /**
   * Sets the filter value(s) for any column type.
   * Creates the filter if it doesn't exist. Normalizes values for number/bigint/date.
   * Auto-transitions the operator via `determineNewOperator`.
   */
  setFilterValue<TData, TType extends ColumnDataType>(
    filters: FiltersState,
    column: Column<TData, TType>,
    values: FilterModel<TType>['values'],
  ): FiltersState {
    const operatorSet = getOperatorSet(column)
    const filter = filters.find((f) => f.columnId === column.id)
    const isColumnFiltered = filter && filter.values.length > 0

    // Normalize values based on column type
    const newValues =
      column.type === 'number'
        ? createNumberFilterValue(values as number[])
        : column.type === 'bigint'
          ? createBigIntFilterValue(values as bigint[])
          : column.type === 'date'
            ? createDateFilterValue(
                values as [Date, Date] | [Date] | [] | undefined,
              )
            : uniq(values)

    if (newValues.length === 0) return filters

    if (!isColumnFiltered) {
      const target = newValues.length > 1 ? 'multiple' : 'single'
      return [
        ...filters,
        {
          columnId: column.id,
          type: column.type,
          operator: operatorSet.getDefault(target).id,
          values: newValues,
        },
      ]
    }

    const oldValues = filter.values
    const newOperator = determineNewOperator(
      operatorSet,
      oldValues,
      newValues,
      filter.operator,
    )

    return filters.map((f) =>
      f.columnId === column.id
        ? {
            columnId: column.id,
            type: column.type,
            operator: newOperator,
            values: newValues as any,
          }
        : f,
    )
  },

  /**
   * Sets the operator for an existing filter.
   * Does nothing if the filter doesn't exist.
   */
  setFilterOperator(
    filters: FiltersState,
    columnId: string,
    operator: string,
  ): FiltersState {
    return filters.map((f) =>
      f.columnId === columnId ? { ...f, operator } : f,
    )
  },

  /**
   * Removes the filter for a specific column.
   */
  removeFilter(filters: FiltersState, columnId: string): FiltersState {
    return filters.filter((f) => f.columnId !== columnId)
  },

  /**
   * Removes all filters.
   */
  removeAllFilters(): FiltersState {
    return []
  },
}
