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
  const getOptions = createMemoizedOptions(columnConfig, data, strategy)
  const getValues = createMemoizedValues(columnConfig, data, strategy)
  const getUniqueValues = createMemoizedUniqueValues(
    columnConfig,
    getValues,
    strategy,
  )
  const getMinMaxValues = createMemoizedMinMaxValues(
    columnConfig,
    data,
    strategy,
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
    setupPrefetchMethods(column, {
      getOptions,
      getValues,
      getUniqueValues,
      getMinMaxValues,
    })
  }

  return column
}

function createMemoizedOptions<TData>(
  columnConfig: ColumnConfig<TData, any, any, any>,
  data: TData[],
  strategy: FilterStrategy,
) {
  return memo(
    () => [data, strategy, columnConfig.options],
    ([data, strategy]) =>
      getColumnOptions(columnConfig, data as any, strategy as any),
    { key: `options-${columnConfig.id}` },
  )
}

function createMemoizedValues<TData>(
  columnConfig: ColumnConfig<TData, any, any, any>,
  data: TData[],
  strategy: FilterStrategy,
) {
  return memo(
    () => [data, strategy],
    () => (strategy === 'client' ? getColumnValues(columnConfig, data) : []),
    { key: `values-${columnConfig.id}` },
  )
}

function createMemoizedUniqueValues<TData>(
  columnConfig: ColumnConfig<TData, any, any, any>,
  getValues: () => ElementType<NonNullable<any>>[],
  strategy: FilterStrategy,
) {
  return memo(
    () => [getValues(), strategy],
    ([values, strategy]) =>
      getFacetedUniqueValues(columnConfig, values as any, strategy as any),
    { key: `faceted-${columnConfig.id}` },
  )
}

function createMemoizedMinMaxValues<TData>(
  columnConfig: ColumnConfig<TData, any, any, any>,
  data: TData[],
  strategy: FilterStrategy,
) {
  return memo(
    () => [data, strategy],
    () => getFacetedMinMaxValues(columnConfig, data, strategy),
    { key: `minmax-${columnConfig.id}` },
  )
}

function setupPrefetchMethods<TData>(
  column: Column<TData>,
  methods: {
    getOptions: () => any
    getValues: () => any
    getUniqueValues: () => any
    getMinMaxValues: () => any
  },
) {
  const { getOptions, getValues, getUniqueValues, getMinMaxValues } = methods

  column.prefetchOptions = async (): Promise<void> => {
    if (!column._prefetchedOptionsCache) {
      await new Promise((resolve) =>
        setTimeout(() => {
          column._prefetchedOptionsCache = getOptions()
          resolve(undefined)
        }, 0),
      )
    }
  }

  column.prefetchValues = async (): Promise<void> => {
    if (!column._prefetchedValuesCache) {
      await new Promise((resolve) =>
        setTimeout(() => {
          column._prefetchedValuesCache = getValues()
          resolve(undefined)
        }, 0),
      )
    }
  }

  column.prefetchFacetedUniqueValues = async (): Promise<void> => {
    if (!column._prefetchedFacetedUniqueValuesCache) {
      await new Promise((resolve) =>
        setTimeout(() => {
          column._prefetchedFacetedUniqueValuesCache = getUniqueValues() ?? null
          resolve(undefined)
        }, 0),
      )
    }
  }

  column.prefetchFacetedMinMaxValues = async (): Promise<void> => {
    if (!column._prefetchedFacetedMinMaxValuesCache) {
      await new Promise((resolve) =>
        setTimeout(() => {
          column._prefetchedFacetedMinMaxValuesCache = getMinMaxValues() ?? null
          resolve(undefined)
        }, 0),
      )
    }
  }
}
