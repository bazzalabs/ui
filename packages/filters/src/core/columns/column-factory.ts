import { memo } from '../../lib/memo.js'
import type {
  Column,
  ColumnConfig,
  ElementType,
  FilterStrategy,
} from '../types.js'
import { ColumnDataService } from './column-data-service.js'

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
  // Create the centralized data service
  const dataService = new ColumnDataService(data, strategy)

  // Create memoized functions
  const getValues = createMemoizedValues(columnConfig, dataService)
  const getUniqueValues = createMemoizedUniqueValues(
    columnConfig,
    dataService,
    getValues,
  )
  const getMinMaxValues = createMemoizedMinMaxValues(columnConfig, dataService)

  // Create the main getOptions function that handles all transforms
  const getOptions = createMemoizedOptionsWithTransforms(
    columnConfig,
    dataService,
    getValues,
    getUniqueValues,
  )

  // Create the Column instance
  const column: Column<TData> = {
    ...columnConfig,
    getOptions, // This now returns fully processed options
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

/**
 * Creates the main getOptions function that returns fully processed options.
 * This includes all transforms and post-processing, plus automatic count population.
 */
function createMemoizedOptionsWithTransforms<TData>(
  columnConfig: ColumnConfig<TData, any, any, any>,
  dataService: ColumnDataService<TData>,
  getValues: () => ElementType<NonNullable<any>>[],
  getUniqueValues: () => Map<string, number> | undefined,
) {
  return memo(
    () => [
      dataService,
      columnConfig.options,
      columnConfig.transformOptionFn,
      columnConfig.transformOptionsFn,
      columnConfig.orderFn,
      getValues(), // Include values as dependency for reactivity
    ],
    () => {
      // Step 1: Get base options (without count)
      const baseOptions = dataService.computeOptions(columnConfig)

      // Step 2: Get faceted data for counts
      const facetedData = getUniqueValues()

      // Step 3: Add count property to each option
      const optionsWithCounts = baseOptions.map((option) => ({
        ...option,
        count: facetedData?.get(option.value) || 0,
      }))

      // Step 4: Apply transformOptionsFn if provided
      if (columnConfig.transformOptionsFn) {
        return columnConfig.transformOptionsFn(optionsWithCounts)
      }

      return optionsWithCounts
    },
    { key: `final-options-${columnConfig.id}` },
  )
}

function createMemoizedValues<TData>(
  columnConfig: ColumnConfig<TData, any, any, any>,
  dataService: ColumnDataService<TData>,
) {
  return memo(
    () => [dataService],
    ([dataService]) => dataService.getValues(columnConfig),
    { key: `values-${columnConfig.id}` },
  )
}

function createMemoizedUniqueValues<TData>(
  columnConfig: ColumnConfig<TData, any, any, any>,
  dataService: ColumnDataService<TData>,
  getValues: () => ElementType<NonNullable<any>>[],
) {
  return memo(
    () => [getValues(), dataService],
    ([values, dataService]) =>
      dataService.computeFacetedUniqueValues(columnConfig, values as any),
    { key: `faceted-${columnConfig.id}` },
  )
}

function createMemoizedMinMaxValues<TData>(
  columnConfig: ColumnConfig<TData, any, any, any>,
  dataService: ColumnDataService<TData>,
) {
  return memo(
    () => [dataService],
    ([dataService]) => dataService.computeFacetedMinMaxValues(columnConfig),
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
