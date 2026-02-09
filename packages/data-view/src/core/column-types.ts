// @bazza-ui/data-view — Column Types
// ColumnType definition, defineColumnType factory, and built-in column types.

import {
  createBigIntFilterValue,
  createDateFilterValue,
  createNumberFilterValue,
} from '../lib/helpers.js'
import type { OperatorSet } from './operator-set.js'
import {
  bigIntOperators,
  booleanOperators,
  dateOperators,
  multiOptionOperators,
  numberOperators,
  optionOperators,
  textOperators,
} from './operator-sets.js'
import type { BuiltInColumnDataType } from './types.js'

// ── Types ───────────────────────────────────────────────────

/**
 * Configuration for creating a column type via `defineColumnType`.
 * `normalizeValues` defaults to identity if not provided.
 */
export interface ColumnTypeConfig<TValue = unknown> {
  /** Unique string identifier for this column type (e.g. 'text', 'currency'). */
  id: string
  /** The operator set used for filtering this column type. */
  operators: OperatorSet
  /**
   * Normalizes filter values before they are stored.
   * For example, sorting range values [10, 5] → [5, 10].
   * Defaults to identity if not provided.
   */
  normalizeValues?: (values: TValue[]) => TValue[]
  /** Serializes a value for JSON persistence (e.g. Date → ISO string, BigInt → string). */
  serialize?: (value: TValue) => unknown
  /** Deserializes a value from JSON persistence (e.g. ISO string → Date). */
  deserialize?: (raw: unknown) => TValue
}

/**
 * A fully resolved column type with all properties set.
 * `normalizeValues` is always present (identity if not explicitly configured).
 */
export interface ColumnType<TValue = unknown> {
  /** Unique string identifier for this column type. */
  id: string
  /** The operator set used for filtering this column type. */
  operators: OperatorSet
  /** Normalizes filter values before they are stored. */
  normalizeValues: (values: TValue[]) => TValue[]
  /** Serializes a value for JSON persistence. */
  serialize?: (value: TValue) => unknown
  /** Deserializes a value from JSON persistence. */
  deserialize?: (raw: unknown) => TValue
}

// ── Factory ─────────────────────────────────────────────────

/**
 * Creates a `ColumnType` from a configuration object.
 * If `normalizeValues` is not provided, it defaults to an identity function.
 *
 * @example
 * ```typescript
 * const currencyType = defineColumnType<number>({
 *   id: 'currency',
 *   operators: numberOperators.extend({
 *     'is zero': { label: 'is zero', target: 'single', match: (v) => v === 0 },
 *   }),
 *   normalizeValues: (values) => values.sort((a, b) => a - b),
 *   serialize: (v) => v,
 *   deserialize: (raw) => Number(raw),
 * })
 * ```
 */
export function defineColumnType<TValue = unknown>(
  config: ColumnTypeConfig<TValue>,
): ColumnType<TValue> {
  return {
    id: config.id,
    operators: config.operators,
    normalizeValues: config.normalizeValues ?? ((values) => values),
    serialize: config.serialize,
    deserialize: config.deserialize,
  }
}

// ── Built-in Column Types ───────────────────────────────────

export const textType = defineColumnType<string>({
  id: 'text',
  operators: textOperators,
})

export const numberType = defineColumnType<number>({
  id: 'number',
  operators: numberOperators,
  normalizeValues: (values) => createNumberFilterValue(values) as number[],
})

export const bigIntType = defineColumnType<bigint>({
  id: 'bigint',
  operators: bigIntOperators,
  normalizeValues: (values) => createBigIntFilterValue(values) as bigint[],
  serialize: (value) => String(value),
  deserialize: (raw) => BigInt(raw as string | number),
})

export const dateType = defineColumnType<Date>({
  id: 'date',
  operators: dateOperators,
  normalizeValues: (values) =>
    createDateFilterValue(
      values as [Date, Date] | [Date] | [] | undefined,
    ) as Date[],
  serialize: (value) => value.toISOString(),
  deserialize: (raw) => new Date(raw as string | number),
})

export const booleanType = defineColumnType<boolean>({
  id: 'boolean',
  operators: booleanOperators,
})

export const optionType = defineColumnType<string>({
  id: 'option',
  operators: optionOperators,
})

export const multiOptionType = defineColumnType<string[]>({
  id: 'multiOption',
  operators: multiOptionOperators,
})

// ── Built-in Column Types Map ───────────────────────────────

// biome-ignore lint/suspicious/noExplicitAny: variance — concrete ColumnType<T> is not assignable to ColumnType<unknown>
export const builtInColumnTypes: Record<
  BuiltInColumnDataType,
  ColumnType<any>
> = {
  text: textType,
  number: numberType,
  bigint: bigIntType,
  date: dateType,
  boolean: booleanType,
  option: optionType,
  multiOption: multiOptionType,
}
