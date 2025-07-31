import type {
  ColumnConfig,
  ColumnDataType,
  ColumnOption,
  FilterStrategy,
} from '../types.js'
import { ColumnDataService } from './column-data-service.js'

/**
 * @deprecated Use ColumnDataService.computeOptions() instead.
 * This function is kept for backward compatibility.
 */
export function getColumnOptions<TData, TType extends ColumnDataType, TVal>(
  column: ColumnConfig<TData, TType, TVal>,
  data: TData[],
  strategy: FilterStrategy,
): ColumnOption[] {
  const service = new ColumnDataService(data, strategy)
  return service.computeOptions(column)
}

/**
 * @deprecated Use ColumnDataService.getValues() instead.
 * This function is kept for backward compatibility.
 */
export function getColumnValues<TData, TType extends ColumnDataType, TVal>(
  column: ColumnConfig<TData, TType, TVal>,
  data: TData[],
) {
  const service = new ColumnDataService(data, 'client')
  return service.getValues(column)
}

/**
 * @deprecated Use ColumnDataService.computeFacetedUniqueValues() instead.
 * This function is kept for backward compatibility.
 */
export function getFacetedUniqueValues<
  TData,
  TType extends ColumnDataType,
  TVal,
>(
  column: ColumnConfig<TData, TType, TVal>,
  values: string[] | ColumnOption[],
  strategy: FilterStrategy,
): Map<string, number> | undefined {
  const service = new ColumnDataService([], strategy)
  return service.computeFacetedUniqueValues(column, values)
}

/**
 * @deprecated Use ColumnDataService.computeFacetedMinMaxValues() instead.
 * This function is kept for backward compatibility.
 */
export function getFacetedMinMaxValues<
  TData,
  TType extends ColumnDataType,
  TVal,
>(
  column: ColumnConfig<TData, TType, TVal>,
  data: TData[],
  strategy: FilterStrategy,
): [number, number] | undefined {
  const service = new ColumnDataService(data, strategy)
  return service.computeFacetedMinMaxValues(column)
}
