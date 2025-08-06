import { DEFAULT_OPERATORS, determineNewOperator } from '../core/operators.js'
import type {
  Column,
  ColumnDataType,
  FilterModel,
  FilterOperations,
  FiltersState,
  OptionBasedColumnDataType,
} from '../core/types.js'
import { addUniq, removeUniq, uniq } from '../lib/array.js'
import {
  createDateFilterValue,
  createNumberFilterValue,
} from '../lib/helpers.js'

export const filterOperations: FilterOperations = {
  addFilterValue<TData, TType extends OptionBasedColumnDataType>(
    filters: FiltersState,
    column: Column<TData, TType>,
    values: FilterModel<TType>['values'],
  ): FiltersState {
    if (column.type === 'option') {
      const filter = filters.find((f) => f.columnId === column.id)
      const isColumnFiltered = filter && filter.values.length > 0

      if (!isColumnFiltered) {
        return [
          ...filters,
          {
            columnId: column.id,
            type: column.type,
            operator:
              values.length > 1
                ? DEFAULT_OPERATORS[column.type]!.multiple
                : DEFAULT_OPERATORS[column.type]!.single,
            values,
          },
        ]
      }

      const oldValues = filter.values
      const newValues = addUniq(filter.values, values)
      const newOperator = determineNewOperator(
        'option',
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
              values: newValues,
            }
          : f,
      )
    }

    if (column.type === 'multiOption') {
      const filter = filters.find((f) => f.columnId === column.id)
      const isColumnFiltered = filter && filter.values.length > 0

      if (!isColumnFiltered) {
        return [
          ...filters,
          {
            columnId: column.id,
            type: column.type,
            operator:
              values.length > 1
                ? DEFAULT_OPERATORS[column.type]!.multiple
                : DEFAULT_OPERATORS[column.type]!.single,
            values,
          },
        ]
      }

      const oldValues = filter.values
      const newValues = addUniq(filter.values, values)
      const newOperator = determineNewOperator(
        'multiOption',
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
    }

    throw new Error(
      '[data-table-filter] addFilterValue() is only supported for option columns',
    )
  },

  removeFilterValue<TData, TType extends OptionBasedColumnDataType>(
    filters: FiltersState,
    column: Column<TData, TType>,
    value: FilterModel<TType>['values'],
  ): FiltersState {
    if (column.type === 'option' || column.type === 'multiOption') {
      const filter = filters.find((f) => f.columnId === column.id)
      const isColumnFiltered = filter && filter.values.length > 0

      if (!isColumnFiltered) {
        return filters
      }

      const newValues = removeUniq(filter.values, value)
      const oldValues = filter.values
      const newOperator = determineNewOperator(
        column.type,
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
    }

    throw new Error(
      '[data-table-filter] removeFilterValue() is only supported for option columns',
    )
  },

  setFilterValue<TData, TType extends ColumnDataType>(
    filters: FiltersState,
    column: Column<TData, TType>,
    values: FilterModel<TType>['values'],
  ): FiltersState {
    const filter = filters.find((f) => f.columnId === column.id)
    const isColumnFiltered = filter && filter.values.length > 0

    const newValues =
      column.type === 'number'
        ? createNumberFilterValue(values as number[])
        : column.type === 'date'
          ? createDateFilterValue(
              values as [Date, Date] | [Date] | [] | undefined,
            )
          : uniq(values)

    if (newValues.length === 0) return filters

    if (!isColumnFiltered) {
      return [
        ...filters,
        {
          columnId: column.id,
          type: column.type,
          operator:
            values.length > 1
              ? DEFAULT_OPERATORS[column.type]!.multiple
              : DEFAULT_OPERATORS[column.type]!.single,
          values: newValues,
        },
      ]
    }

    const oldValues = filter.values
    const newOperator = determineNewOperator(
      column.type,
      oldValues,
      newValues,
      filter.operator,
    )

    const newFilter = {
      columnId: column.id,
      type: column.type,
      operator: newOperator,
      values: newValues as any,
    } satisfies FilterModel<TType>

    return filters.map((f) => (f.columnId === column.id ? newFilter : f))
  },

  setFilterOperator<TType extends ColumnDataType>(
    filters: FiltersState,
    columnId: string,
    operator: FilterModel<TType>['operator'],
  ): FiltersState {
    return filters.map((f) =>
      f.columnId === columnId ? { ...f, operator } : f,
    )
  },

  removeFilter(filters: FiltersState, columnId: string): FiltersState {
    return filters.filter((f) => f.columnId !== columnId)
  },

  removeAllFilters(): FiltersState {
    return []
  },
}
