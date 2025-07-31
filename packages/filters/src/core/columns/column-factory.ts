import { memo } from '../../lib/memo.js'
import {
  getColumnOptions,
  getColumnValues,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
} from '../columns/utils.js'
import type {
  Column,
  ColumnConfig,
  ColumnOption,
  ElementType,
  FilterStrategy,
} from '../types.js'

export function createColumns<TData>(
  data: TData[],
  columnConfigs: ReadonlyArray<ColumnConfig<TData, any, any, any>>,
  strategy: FilterStrategy,
): Column<TData>[] {
  return columnConfigs.map((columnConfig) =>
    createColumn(columnConfig, data, strategy),
  )
}

export function createColumn<TData>(
  columnConfig: ColumnConfig<TData, any, any, any>,
  data: TData[],
  strategy: FilterStrategy,
): Column<TData> {
  const getOptions: () => ColumnOption[] = memo(
    () => [data, strategy, columnConfig.options],
    ([data, strategy]) =>
      getColumnOptions(columnConfig, data as any, strategy as any),
    { key: `options-${columnConfig.id}` },
  )

  const getValues: () => ElementType<NonNullable<any>>[] = memo(
    () => [data, strategy],
    () => (strategy === 'client' ? getColumnValues(columnConfig, data) : []),
    { key: `values-${columnConfig.id}` },
  )

  const getUniqueValues: () => Map<string, number> | undefined = memo(
    () => [getValues(), strategy],
    ([values, strategy]) =>
      getFacetedUniqueValues(columnConfig, values as any, strategy as any),
    { key: `faceted-${columnConfig.id}` },
  )

  const getMinMaxValues: () => [number, number] | undefined = memo(
    () => [data, strategy],
    () => getFacetedMinMaxValues(columnConfig, data, strategy),
    { key: `minmax-${columnConfig.id}` },
  )

  // Create the Column instance
  const column: Column<TData> = {
    ...columnConfig,
    getOptions,
    getValues,
    getFacetedUniqueValues: getUniqueValues,
    getFacetedMinMaxValues: getMinMaxValues,
    // Prefetch methods will be added below
    prefetchOptions: async () => {}, // Placeholder, defined below
    prefetchValues: async () => {},
    prefetchFacetedUniqueValues: async () => {},
    prefetchFacetedMinMaxValues: async () => {},
    _prefetchedOptionsCache: null, // Initialize private cache
    _prefetchedValuesCache: null,
    _prefetchedFacetedUniqueValuesCache: null,
    _prefetchedFacetedMinMaxValuesCache: null,
  }

  if (strategy === 'client') {
    // Define prefetch methods with access to the column instance
    column.prefetchOptions = async (): Promise<void> => {
      if (!column._prefetchedOptionsCache) {
        await new Promise((resolve) =>
          setTimeout(() => {
            const options = getOptions()
            column._prefetchedOptionsCache = options
            // console.log(`Prefetched options for ${columnConfig.id}`)
            resolve(undefined)
          }, 0),
        )
      }
    }

    column.prefetchValues = async (): Promise<void> => {
      if (!column._prefetchedValuesCache) {
        await new Promise((resolve) =>
          setTimeout(() => {
            const values = getValues()
            column._prefetchedValuesCache = values
            // console.log(`Prefetched values for ${columnConfig.id}`)
            resolve(undefined)
          }, 0),
        )
      }
    }

    column.prefetchFacetedUniqueValues = async (): Promise<void> => {
      if (!column._prefetchedFacetedUniqueValuesCache) {
        await new Promise((resolve) =>
          setTimeout(() => {
            const facetedMap = getUniqueValues()
            column._prefetchedFacetedUniqueValuesCache = facetedMap ?? null
            // console.log(
            //   `Prefetched faceted unique values for ${columnConfig.id}`,
            // )
            resolve(undefined)
          }, 0),
        )
      }
    }

    column.prefetchFacetedMinMaxValues = async (): Promise<void> => {
      if (!column._prefetchedFacetedMinMaxValuesCache) {
        await new Promise((resolve) =>
          setTimeout(() => {
            const value = getMinMaxValues()
            column._prefetchedFacetedMinMaxValuesCache = value ?? null
            // console.log(
            //   `Prefetched faceted min/max values for ${columnConfig.id}`,
            // )
            resolve(undefined)
          }, 0),
        )
      }
    }
  }

  return column
}
