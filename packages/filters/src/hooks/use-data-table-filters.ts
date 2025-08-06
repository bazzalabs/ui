'use client'

import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { createColumns } from '../core/columns/index.js'
import { filterOperations } from '../core/filters.js'
import type {
  BatchFilterOperations,
  Column,
  ColumnConfig,
  ColumnDataType,
  ColumnOption,
  DataTableFilterActions,
  DataTableFilterBatchActions,
  FilterModel,
  FilterStrategy,
  FiltersState,
  NumberColumnIds,
  OptionBasedColumnDataType,
  OptionColumnIds,
  StateUpdaterFn,
} from '../core/types.js'
import {
  isColumnOptionArray,
  isColumnOptionMap,
  isMinMaxTuple,
} from '../lib/helpers.js'

export interface DataTableFiltersOptions<
  TData,
  TColumns extends ReadonlyArray<ColumnConfig<TData, any, any, any>>,
  TStrategy extends FilterStrategy,
> {
  strategy: TStrategy
  data: TData[]
  columnsConfig: TColumns
  defaultFilters?: FiltersState
  filters?: FiltersState
  onFiltersChange?:
    | React.Dispatch<React.SetStateAction<FiltersState>>
    | StateUpdaterFn<FiltersState>
  options?: Partial<
    Record<OptionColumnIds<TColumns>, ColumnOption[] | undefined>
  >
  faceted?: Partial<
    | Record<OptionColumnIds<TColumns>, Map<string, number> | undefined>
    | Record<NumberColumnIds<TColumns>, [number, number] | undefined>
  >
  entityName?: string
}

export function useDataTableFilters<
  TData,
  TColumns extends ReadonlyArray<ColumnConfig<TData, any, any, any>>,
  TStrategy extends FilterStrategy,
>({
  strategy,
  data,
  columnsConfig,
  defaultFilters,
  filters: externalFilters,
  onFiltersChange,
  options,
  faceted,
  entityName,
}: DataTableFiltersOptions<TData, TColumns, TStrategy>) {
  const [internalFilters, setInternalFilters] = useState<FiltersState>(
    defaultFilters ?? [],
  )

  if (
    (externalFilters && !onFiltersChange) ||
    (!externalFilters && onFiltersChange)
  ) {
    throw new Error(
      'If using controlled state, you must specify both filters and onFiltersChange.',
    )
  }

  const isControlled =
    externalFilters !== undefined && onFiltersChange !== undefined

  const filters = isControlled ? externalFilters : internalFilters

  const setFilters = useCallback(
    (nextFilters: FiltersState | ((prev: FiltersState) => FiltersState)) => {
      // Handle change for controlled mode
      if (isControlled) {
        // For controlled mode, we need to resolve the function and call the handler
        const prevFilters = filters
        const resolvedNextFilters =
          typeof nextFilters === 'function'
            ? nextFilters(prevFilters) // If function: call it with prev to get next
            : nextFilters // If value: use it directly

        // Detect handler type by function length and call appropriately
        if (onFiltersChange.length <= 1) {
          // React Dispatch style
          const dispatchHandler = onFiltersChange as React.Dispatch<
            React.SetStateAction<FiltersState>
          >
          dispatchHandler(resolvedNextFilters)
        } else {
          // Custom handler style
          const customHandler = onFiltersChange as (
            prev: FiltersState,
            next: FiltersState,
          ) => void

          customHandler(prevFilters, resolvedNextFilters)
        }
      } else if (!isControlled) {
        // Uncontrolled mode: let React handle the function resolution
        setInternalFilters(nextFilters)
      }
    },
    [filters, isControlled, onFiltersChange],
  )

  // Convert ColumnConfig to Column, applying options and faceted options if provided
  const columns = useMemo(() => {
    const enhancedConfigs = columnsConfig.map((config) => {
      let final = config

      // Set options, if exists
      if (
        options &&
        (config.type === 'option' || config.type === 'multiOption')
      ) {
        const optionsInput = options[config.id as OptionColumnIds<TColumns>]
        if (!optionsInput || !isColumnOptionArray(optionsInput)) return config

        final = { ...final, options: optionsInput }
      }

      // Set faceted options, if exists
      if (
        faceted &&
        (config.type === 'option' || config.type === 'multiOption')
      ) {
        const facetedOptionsInput =
          faceted[config.id as OptionColumnIds<TColumns>]
        if (!facetedOptionsInput || !isColumnOptionMap(facetedOptionsInput))
          return config

        final = { ...final, facetedOptions: facetedOptionsInput }
      }

      // Set faceted min/max values, if exists
      if (config.type === 'number' && faceted) {
        const minMaxTuple = faceted[config.id as NumberColumnIds<TColumns>]
        if (!minMaxTuple || !isMinMaxTuple(minMaxTuple)) return config

        final = {
          ...final,
          min: minMaxTuple[0],
          max: minMaxTuple[1],
        }
      }

      return final
    })

    return createColumns(data, enhancedConfigs, strategy)
  }, [data, columnsConfig, options, faceted, strategy])

  const actions: DataTableFilterActions = useMemo(
    () => ({
      addFilterValue<TData, TType extends OptionBasedColumnDataType>(
        column: Column<TData, TType>,
        values: FilterModel<TType>['values'],
      ) {
        setFilters((prev) =>
          filterOperations.addFilterValue(prev, column, values),
        )
      },

      removeFilterValue<TData, TType extends OptionBasedColumnDataType>(
        column: Column<TData, TType>,
        value: FilterModel<TType>['values'],
      ) {
        setFilters((prev) =>
          filterOperations.removeFilterValue(prev, column, value),
        )
      },

      setFilterValue<TData, TType extends ColumnDataType>(
        column: Column<TData, TType>,
        values: FilterModel<TType>['values'],
      ) {
        setFilters((prev) =>
          filterOperations.setFilterValue(prev, column, values),
        )
      },

      setFilterOperator<TType extends ColumnDataType>(
        columnId: string,
        operator: FilterModel<TType>['operator'],
      ) {
        setFilters((prev) =>
          filterOperations.setFilterOperator(prev, columnId, operator),
        )
      },

      removeFilter(columnId: string) {
        setFilters((prev) => filterOperations.removeFilter(prev, columnId))
      },

      removeAllFilters() {
        setFilters((prev) => filterOperations.removeAllFilters(prev))
      },

      batch(callback: (batchActions: DataTableFilterBatchActions) => void) {
        setFilters((prevFilters) => {
          // Start with current state
          let transactionFilters = prevFilters

          // Create batch actions that apply operations to transaction state
          const batchActions: BatchFilterOperations = {
            addFilterValue<TData, TType extends OptionBasedColumnDataType>(
              column: Column<TData, TType>,
              values: FilterModel<TType>['values'],
            ) {
              transactionFilters = filterOperations.addFilterValue(
                transactionFilters,
                column,
                values,
              )
            },

            removeFilterValue<TData, TType extends OptionBasedColumnDataType>(
              column: Column<TData, TType>,
              value: FilterModel<TType>['values'],
            ) {
              transactionFilters = filterOperations.removeFilterValue(
                transactionFilters,
                column,
                value,
              )
            },

            setFilterValue<TData, TType extends ColumnDataType>(
              column: Column<TData, TType>,
              values: FilterModel<TType>['values'],
            ) {
              transactionFilters = filterOperations.setFilterValue(
                transactionFilters,
                column,
                values,
              )
            },

            setFilterOperator<TType extends ColumnDataType>(
              columnId: string,
              operator: FilterModel<TType>['operator'],
            ) {
              transactionFilters = filterOperations.setFilterOperator(
                transactionFilters,
                columnId,
                operator,
              )
            },

            removeFilter(columnId: string) {
              transactionFilters = filterOperations.removeFilter(
                transactionFilters,
                columnId,
              )
            },

            removeAllFilters() {
              transactionFilters =
                filterOperations.removeAllFilters(transactionFilters)
            },
          }

          // Execute the callback with batch actions
          callback(batchActions)

          // Return the final transaction state
          return transactionFilters
        })
      },
    }),
    [setFilters],
  )

  return { columns, filters, actions, strategy, entityName } // columns is Column<TData>[]
}
