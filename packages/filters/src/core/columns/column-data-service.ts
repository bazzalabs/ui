import { isAnyOf, uniq } from '../../lib/array.js'
import { isColumnOptionArray } from '../../lib/helpers.js'
import { memo } from '../../lib/memo.js'
import { applyOrderFns } from '../../lib/order-fns.js'
import type {
  ColumnConfig,
  ColumnDataType,
  ColumnOption,
  ElementType,
  FilterStrategy,
  Nullable,
} from '../types.js'

/**
 * Consolidated service for handling all column data operations including:
 * - Computing column options
 * - Getting column values
 * - Computing faceted unique values
 * - Computing faceted min/max values
 *
 * This centralizes the logic that was previously scattered across utils.ts and column-factory.ts
 */
export class ColumnDataService<TData> {
  constructor(
    private data: TData[],
    private strategy: FilterStrategy,
  ) {}

  /**
   * Step 1: Computes base column options without counts, ordering, or transforms
   */
  computeBaseOptions<TType extends ColumnDataType, TVal>(
    column: ColumnConfig<TData, TType, TVal>,
  ): ColumnOption[] {
    if (!isAnyOf(column.type, ['option', 'multiOption'])) {
      return []
    }

    if (this.strategy === 'server' && !column.options) {
      throw new Error('column options are required for server-side filtering')
    }

    // If static options are provided, use them as the base
    if (column.options) {
      return column.options
    }

    // Compute options from data
    const filtered = this.data
      .flatMap(column.accessor)
      .filter((v): v is NonNullable<TVal> => v !== undefined && v !== null)

    const uniqueValues = uniq(filtered)
    let columnOptions: ColumnOption[] = []

    // Transform individual values to options
    if (column.transformValueToOptionFn) {
      columnOptions = uniqueValues.map((m) =>
        column.transformValueToOptionFn!(m as ElementType<NonNullable<TVal>>),
      )
    }

    if (isColumnOptionArray(columnOptions)) {
      return columnOptions
    }

    throw new Error(
      `[data-table-filter] [${column.id}] Either provide static options, a transformValueToOptionFn, or ensure the column data conforms to ColumnOption type`,
    )
  }

  /**
   * Step 2: Computes ordered options with counts applied
   */
  computeOrderedOptions<TType extends ColumnDataType, TVal>(
    column: ColumnConfig<TData, TType, TVal>,
  ): ColumnOption[] {
    const baseOptions = this.computeBaseOptions(column)
    const values = this.getValues(column)

    // Add counts to base options
    const facetedData = this.computeFacetedUniqueValues(column, values as any)
    const optionsWithCounts = baseOptions.map((option) => ({
      ...option,
      count: facetedData?.get(option.value) || 0,
    }))

    // Apply ordering if provided
    if (column.orderFn) {
      return applyOrderFns(column.orderFn, optionsWithCounts)
    }

    return optionsWithCounts
  }

  /**
   * Step 3: Computes final transformed options
   */
  computeTransformedOptions<TType extends ColumnDataType, TVal>(
    column: ColumnConfig<TData, TType, TVal>,
  ): ColumnOption[] {
    const orderedOptions = this.computeOrderedOptions(column)

    if (!column.transformOptionsFn) return orderedOptions
    return column.transformOptionsFn(orderedOptions)
  }

  /**
   * Gets raw column values for processing
   */
  getValues<TType extends ColumnDataType, TVal>(
    column: ColumnConfig<TData, TType, TVal>,
  ): ElementType<NonNullable<TVal>>[] {
    // Memoize accessor calls
    const memoizedAccessor = memo(
      () => [this.data],
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
        .filter((v) => v !== undefined && v !== null) as ElementType<
        NonNullable<TVal>
      >[]
    }

    if (column.transformValueToOptionFn) {
      const memoizedTransform = memo(
        () => [raw],
        (deps) =>
          (deps[0] ?? []).map(
            (v) =>
              column.transformValueToOptionFn!(v) as ElementType<
                NonNullable<TVal>
              >,
          ),
        { key: `transform-values-${column.id}` },
      )
      return memoizedTransform()
    }

    if (isColumnOptionArray(raw)) {
      return raw
    }

    throw new Error(
      `[data-table-filter] [${column.id}] Either provide static options, a transformValueToOptionFn, or ensure the column data conforms to ColumnOption type`,
    )
  }

  /**
   * Computes faceted unique values for option-based columns
   */
  computeFacetedUniqueValues<TType extends ColumnDataType, TVal>(
    column: ColumnConfig<TData, TType, TVal>,
    values: string[] | ColumnOption[],
  ): Map<string, number> | undefined {
    if (!isAnyOf(column.type, ['option', 'multiOption'])) {
      console.warn(
        'Faceted unique values can only be retrieved for option and multiOption columns',
      )
      return new Map<string, number>()
    }

    if (this.strategy === 'server') {
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

  /**
   * Computes faceted min/max values for number columns
   */
  computeFacetedMinMaxValues<TType extends ColumnDataType, TVal>(
    column: ColumnConfig<TData, TType, TVal>,
  ): [number, number] | undefined {
    if (column.type !== 'number') return undefined

    if (typeof column.min === 'number' && typeof column.max === 'number') {
      return [column.min, column.max]
    }

    if (this.strategy === 'server') {
      return undefined
    }

    const values = this.data
      .flatMap((row) => column.accessor(row) as Nullable<number>)
      .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v))

    if (values.length === 0) {
      return [0, 0]
    }

    const min = Math.min(...values)
    const max = Math.max(...values)

    return [min, max]
  }
}
