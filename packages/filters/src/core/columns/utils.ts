import { isAnyOf, uniq } from '../../lib/array.js'
import { isColumnOptionArray } from '../../lib/helpers.js'
import { memo } from '../../lib/memo.js'
import type {
  ColumnConfig,
  ColumnDataType,
  ColumnOption,
  ElementType,
  FilterStrategy,
  Nullable,
} from '../types.js'

export function getColumnOptions<TData, TType extends ColumnDataType, TVal>(
  column: ColumnConfig<TData, TType, TVal>,
  data: TData[],
  strategy: FilterStrategy,
): ColumnOption[] {
  if (!isAnyOf(column.type, ['option', 'multiOption'])) {
    console.warn(
      'Column options can only be retrieved for option and multiOption columns',
    )
    return []
  }

  if (strategy === 'server' && !column.options) {
    throw new Error('column options are required for server-side filtering')
  }

  if (column.options) {
    return column.options
  }

  const filtered = data
    .flatMap(column.accessor)
    .filter((v): v is NonNullable<TVal> => v !== undefined && v !== null)

  let models = uniq(filtered)

  if (column.orderFn) {
    models = models.sort((m1, m2) =>
      column.orderFn!(
        m1 as ElementType<NonNullable<TVal>>,
        m2 as ElementType<NonNullable<TVal>>,
      ),
    )
  }

  if (column.transformOptionFn) {
    // Memoize transformOptionFn calls
    const memoizedTransform = memo(
      () => [models],
      (deps) =>
        (deps[0] ?? []).map((m) =>
          column.transformOptionFn!(m as ElementType<NonNullable<TVal>>),
        ),
      { key: `transform-${column.id}` },
    )
    return memoizedTransform()
  }

  if (isColumnOptionArray(models)) return models

  throw new Error(
    `[data-table-filter] [${column.id}] Either provide static options, a transformOptionFn, or ensure the column data conforms to ColumnOption type`,
  )
}

export function getColumnValues<TData, TType extends ColumnDataType, TVal>(
  column: ColumnConfig<TData, TType, TVal>,
  data: TData[],
) {
  // Memoize accessor calls
  const memoizedAccessor = memo(
    () => [data],
    (deps) =>
      (deps[0] ?? [])
        .flatMap(column.accessor)
        .filter(
          (v): v is NonNullable<TVal> => v !== undefined && v !== null,
        ) as ElementType<NonNullable<TVal>>[],
    { key: `accessor-${column.id}` },
  )

  const raw = memoizedAccessor()

  if (!isAnyOf(column.type, ['option', 'multiOption'])) {
    return raw
  }

  if (column.options) {
    return raw
      .map((v) => column.options?.find((o) => o.value === v)?.value)
      .filter((v) => v !== undefined && v !== null)
  }

  if (column.transformOptionFn) {
    const memoizedTransform = memo(
      () => [raw],
      (deps) =>
        (deps[0] ?? []).map(
          (v) => column.transformOptionFn!(v) as ElementType<NonNullable<TVal>>,
        ),
      { key: `transform-values-${column.id}` },
    )
    return memoizedTransform()
  }

  if (isColumnOptionArray(raw)) {
    return raw
  }

  throw new Error(
    `[data-table-filter] [${column.id}] Either provide static options, a transformOptionFn, or ensure the column data conforms to ColumnOption type`,
  )
}

export function getFacetedUniqueValues<
  TData,
  TType extends ColumnDataType,
  TVal,
>(
  column: ColumnConfig<TData, TType, TVal>,
  values: string[] | ColumnOption[],
  strategy: FilterStrategy,
): Map<string, number> | undefined {
  if (!isAnyOf(column.type, ['option', 'multiOption'])) {
    console.warn(
      'Faceted unique values can only be retrieved for option and multiOption columns',
    )
    return new Map<string, number>()
  }

  if (strategy === 'server') {
    return column.facetedOptions
  }

  const acc = new Map<string, number>()

  if (isColumnOptionArray(values)) {
    for (const option of values) {
      const curr = acc.get(option.value) ?? 0
      acc.set(option.value, curr + 1)
    }
  } else {
    for (const option of values) {
      const curr = acc.get(option as string) ?? 0
      acc.set(option as string, curr + 1)
    }
  }

  return acc
}

export function getFacetedMinMaxValues<
  TData,
  TType extends ColumnDataType,
  TVal,
>(
  column: ColumnConfig<TData, TType, TVal>,
  data: TData[],
  strategy: FilterStrategy,
): [number, number] | undefined {
  if (column.type !== 'number') return undefined // Only applicable to number columns

  if (typeof column.min === 'number' && typeof column.max === 'number') {
    return [column.min, column.max]
  }

  if (strategy === 'server') {
    return undefined
  }

  const values = data
    .flatMap((row) => column.accessor(row) as Nullable<number>)
    .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v))

  if (values.length === 0) {
    return [0, 0] // Fallback to config or reasonable defaults
  }

  const min = Math.min(...values)
  const max = Math.max(...values)

  return [min, max]
}
