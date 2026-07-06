// @bazza-ui/data-views — Core Types
// This file contains core type definitions for the data-views package.

// ── Utility Types ──────────────────────────────────────────

export type ElementType<T> = T extends (infer U)[] ? U : T

export type Nullable<T> = T | null | undefined

export type NumericValue = number | bigint

/**
 * State updater — accepts either a direct value or a function that
 * receives the previous value and returns the next value.
 * Mirrors React's `setState` signature / TanStack's `Updater` pattern.
 */
export type Updater<T> = T | ((old: T) => T)

// ── Column Data Types ──────────────────────────────────────

export type BuiltInColumnDataType =
  | 'text'
  | 'number'
  | 'bigint'
  | 'date'
  | 'boolean'
  | 'option'
  | 'multiOption'

export type ColumnDataType = BuiltInColumnDataType | (string & {})

export type OptionBasedColumnDataType = Extract<
  ColumnDataType,
  'option' | 'multiOption'
>

// ── Column Data Native Map ─────────────────────────────────

export type ColumnDataNativeMap = {
  text: string
  number: number
  bigint: bigint
  date: Date
  boolean: boolean
  option: string
  multiOption: string[]
}

// ── Filter Values ──────────────────────────────────────────

export type FilterValues<T extends ColumnDataType> =
  T extends keyof ColumnDataNativeMap
    ? Array<ElementType<ColumnDataNativeMap[T]>>
    : unknown[]

// ── Operator Types ──────────────────────────────────────────

export interface OperatorDefinition {
  /** Unique identifier for this operator (e.g. 'contains', 'is_any_of'). */
  id: string
  /** Human-readable label for the operator. */
  label: string
  /** i18n key for localized label. */
  i18nKey?: string
  /** Whether this operator targets a single value or multiple values. */
  target: 'single' | 'multiple'
  /** Match function: returns true if the cell value passes this operator's filter. */
  match?: (cellValue: any, filterValues: any[]) => boolean
  /** The plural-form operator to auto-transition to when values go from 1 → 2+. */
  plural?: string
  /** The singular-form operator to auto-transition to when values go from 2+ → 1. */
  singular?: string
}

export type OperatorDefinitionInput = Omit<OperatorDefinition, 'id'>

// ── Column Option ──────────────────────────────────────────

export interface ColumnOption {
  /** The label to display for the option. */
  label: string
  /** The internal value of the option. */
  value: string
  /** An optional icon to display next to the label. Core uses `unknown` to avoid React dependency. */
  icon?: unknown
  /** The count of this option in the data (automatically populated from faceted data). */
  count?: number
}

export interface ColumnOptionExtended extends ColumnOption {
  selected?: boolean
  count?: number
}

// ── Column Meta ────────────────────────────────────────────

/**
 * Interface for column metadata that can be extended via declaration merging.
 * Users can augment this interface to add custom metadata properties.
 *
 * @example
 * ```typescript
 * declare module '@bazza-ui/data-views' {
 *   interface ColumnMeta {
 *     tooltip?: string
 *     category?: string
 *   }
 * }
 * ```
 */
// biome-ignore lint/suspicious/noEmptyInterface: consumers can override this
export interface ColumnMeta {}

// ── Accessor / Transform Functions ─────────────────────────

export type TAccessorFn<TData, TVal = unknown> = (data: TData) => TVal

export type TTransformValueToOptionFn<TVal = unknown> = (
  value: ElementType<NonNullable<TVal>>,
) => ColumnOption

export type TTransformOptionsFn = (options: ColumnOption[]) => ColumnOption[]

// ── Order Functions ────────────────────────────────────────

export type OrderDirection = 'asc' | 'desc'

export type TOrderFns = Array<TOrderFn>

export type TOrderFn = TCustomOrderFn

export type TCustomOrderFn = (a: ColumnOption, b: ColumnOption) => number

export type TBuiltInOrderFn = (
  a: ColumnOption,
  b: ColumnOption,
  direction: OrderDirection,
) => number

export type TOrderFnArg = [TBuiltInOrderFnName, OrderDirection] | TCustomOrderFn

export type TBuiltInOrderFnName = 'count' | 'label'

// ── Sort State ─────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc'

export type ColumnSort = {
  type: 'column'
  columnId: string
  direction: SortDirection
}

export type CustomSort = {
  type: 'custom'
  id: string
  enabled: boolean
}

export type SortRule = ColumnSort | CustomSort

export type SortState = SortRule[]

// ── Data View State ─────────────────────────────────────────

// biome-ignore lint/suspicious/noEmptyInterface: consumers augment this
export interface DataViewStateMeta {}

export type DataViewState = {
  id?: string
  name?: string
  filters: import('./filter-tree.js').FiltersState
  sort: SortState
  search?: string
  meta?: DataViewStateMeta
}
