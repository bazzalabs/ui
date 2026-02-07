// @bazza-ui/data-view — Core Types
// This file contains all type definitions for the data-view package.

import type { orderFns } from '../lib/order-fns.js'
import type { ColumnType } from './column-types.js'
import type { OperatorSet } from './operator-set.js'

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
  /** Unique identifier for this operator (e.g. 'contains', 'is any of'). */
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
 * declare module '@bazza-ui/data-view' {
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

export type TBuiltInOrderFnName = keyof typeof orderFns

// ── Sort ───────────────────────────────────────────────────

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

// ── Filter ─────────────────────────────────────────────────

export type FilterModel<TType extends ColumnDataType = any> = {
  columnId: string
  type: string
  operator: string
  values: unknown[]
}

export type FiltersState = FilterModel[]

// ── Filter Strategy ────────────────────────────────────────

export type FilterStrategy = 'client' | 'server'

// ── Min/Max ────────────────────────────────────────────────

export type MinMaxReturn<T extends ColumnDataType> = T extends 'number'
  ? [number, number] | undefined
  : T extends 'bigint'
    ? [bigint, bigint] | undefined
    : undefined

// ── Column Config ──────────────────────────────────────────

export type ColumnConfig<
  TData,
  TType extends ColumnDataType = any,
  TVal = unknown,
  TId extends string = string,
> = {
  id: TId
  accessor: TAccessorFn<TData, TVal>
  displayName: string
  /** Icon for the column. Typed as `unknown` in core to avoid React dependency. */
  icon?: unknown
  type: TType
  hidden?: boolean
  options?: TType extends OptionBasedColumnDataType ? ColumnOption[] : never
  facetedOptions?: TType extends OptionBasedColumnDataType
    ? Map<string, number>
    : never
  min?: TType extends 'number'
    ? number
    : TType extends 'bigint'
      ? bigint
      : never
  max?: TType extends 'number'
    ? number
    : TType extends 'bigint'
      ? bigint
      : never
  transformValueToOptionFn?: TType extends OptionBasedColumnDataType
    ? TTransformValueToOptionFn<TVal>
    : never
  orderFn?: TType extends OptionBasedColumnDataType ? TOrderFns : never
  transformOptionsFn?: TType extends OptionBasedColumnDataType
    ? TTransformOptionsFn
    : never
  toggledStateName?: TType extends 'boolean' ? string : never
  meta?: ColumnMeta
  /** Whether this column is sortable. Set via `.sortable()` on the builder. */
  sortable?: boolean
  /** Default sort direction when first toggled. */
  defaultSortDirection?: SortDirection
  /** Per-column operator set override. Takes priority over the default for the column type. */
  operators?: OperatorSet
  /** The resolved column type (set automatically by the builder or via `.custom()`). */
  // biome-ignore lint/suspicious/noExplicitAny: variance — concrete ColumnType<T> not assignable to ColumnType<unknown>
  columnType?: ColumnType<any>
  /** Normalizes filter values before storing (e.g. sorting range bounds). */
  normalizeValues?: (values: unknown[]) => unknown[]
}

// ── Column ID Extraction Utilities ─────────────────────────

export type OptionColumnId<T> = T extends ColumnConfig<
  infer TData,
  'option' | 'multiOption',
  infer TVal,
  infer TId
>
  ? TId
  : never

export type OptionColumnIds<
  T extends ReadonlyArray<ColumnConfig<any, any, any, any>>,
> = {
  [K in keyof T]: OptionColumnId<T[K]>
}[number]

export type NumberColumnId<T> = T extends ColumnConfig<
  infer TData,
  'number',
  infer TVal,
  infer TId
>
  ? TId
  : never

export type NumberColumnIds<
  T extends ReadonlyArray<ColumnConfig<any, any, any, any>>,
> = {
  [K in keyof T]: NumberColumnId<T[K]>
}[number]

export type BigIntColumnId<T> = T extends ColumnConfig<
  infer TData,
  'bigint',
  infer TVal,
  infer TId
>
  ? TId
  : never

export type BigIntColumnIds<
  T extends ReadonlyArray<ColumnConfig<any, any, any, any>>,
> = {
  [K in keyof T]: BigIntColumnId<T[K]>
}[number]

// ── Column Properties (runtime) ────────────────────────────

export type ColumnProperties<TData, TType extends ColumnDataType, TVal> = {
  getOptions: () => ColumnOption[]
  getValues: () => ElementType<NonNullable<TVal>>[]
  getFacetedUniqueValues: () => Map<string, number> | undefined
  getFacetedMinMaxValues: () => MinMaxReturn<TType>
  prefetchOptions: () => Promise<void>
  prefetchValues: () => Promise<void>
  prefetchFacetedUniqueValues: () => Promise<void>
  prefetchFacetedMinMaxValues: () => Promise<void>
}

export type ColumnPrivateProperties<TData, TVal> = {
  _prefetchedOptionsCache: ColumnOption[] | null
  _prefetchedValuesCache: ElementType<NonNullable<TVal>>[] | null
  _prefetchedFacetedUniqueValuesCache: Map<string, number> | null
  _prefetchedFacetedMinMaxValuesCache: [number, number] | null
}

/**
 * State-aware properties attached to each column by the hook.
 * These provide TanStack-style scoped helpers for reading and mutating
 * filter/sort state without having to pass the column reference around.
 *
 * **Readers** reflect the *effective* (merged base + overrides) state.
 * **Mutators** operate on the *overrides* layer by default.
 */
export type ColumnStateProperties = {
  // ── State Readers ──

  /** Whether this column has an active filter in the effective (merged) state. */
  getIsFiltered: () => boolean
  /** The effective (merged) filter for this column, or `undefined`. */
  getFilterValue: () => FilterModel | undefined
  /** The base-layer filter for this column, or `undefined`. */
  getBaseFilterValue: () => FilterModel | undefined
  /** The override-layer filter for this column, or `undefined`. */
  getOverrideFilterValue: () => FilterModel | undefined
  /** Sort direction for this column in the effective state, or `false`. */
  getIsSorted: () => SortDirection | false
  /** Index of this column in the effective sort array, or `-1`. */
  getSortIndex: () => number

  // ── Mutators (operate on overrides layer) ──

  /** Set the override filter value for this column (replaces existing). */
  setFilterValue: (values: unknown[]) => void
  /** Add values to the override filter for this column (option/multiOption). */
  addFilterValue: (values: unknown[]) => void
  /** Remove values from the override filter for this column (option/multiOption). */
  removeFilterValue: (values: unknown[]) => void
  /** Remove the override filter for this column entirely. */
  removeFilter: () => void
  /** Toggle sorting for this column in the overrides layer. */
  toggleSorting: () => void
  /** Remove this column's sort from the overrides layer. */
  clearSorting: () => void
}

export type Column<
  TData,
  TType extends ColumnDataType = any,
  TVal = unknown,
> = ColumnConfig<TData, TType, TVal> &
  ColumnProperties<TData, TType, TVal> &
  ColumnPrivateProperties<TData, TVal> &
  ColumnStateProperties

// ── Faceted Data ───────────────────────────────────────────

export type FacetedColumnData<
  TColumns extends ReadonlyArray<ColumnConfig<any, any, any, any>>,
> = Partial<
  | Record<OptionColumnIds<TColumns>, Map<string, number> | undefined>
  | Record<NumberColumnIds<TColumns>, [number, number] | undefined>
  | Record<BigIntColumnIds<TColumns>, [bigint, bigint] | undefined>
>

// ── Data View State ────────────────────────────────────────

/**
 * Augmentable metadata interface for views.
 *
 * Use TypeScript module augmentation to extend with custom properties:
 * ```ts
 * declare module '@bazza-ui/data-view' {
 *   interface DataViewStateMeta {
 *     description?: string
 *     isPreset?: boolean
 *   }
 * }
 * ```
 */
// biome-ignore lint/suspicious/noEmptyInterface: intentionally empty for augmentation
export interface DataViewStateMeta {}

export type DataViewState = {
  id?: string
  name?: string
  filters: FiltersState
  sort: SortState
  /** Extensible metadata bag — augment `DataViewStateMeta` to add fields. */
  meta?: DataViewStateMeta
}

// ── State Updater ──────────────────────────────────────────

export type DataViewStateUpdaterFn<TContext> = (
  prev: DataViewState,
  next: DataViewState,
  context?: TContext,
) => void

// ── View Layer ─────────────────────────────────────────────

/**
 * A view layer is a self-contained unit of filter + sort state
 * with co-located helper methods for reading and mutating that state.
 *
 * Both `baseView` and `overrides` implement this interface.
 */
export interface ViewLayer<TData, TContext = any> {
  /** Current filters in this layer. */
  readonly filters: FiltersState
  /** Current sort rules in this layer. */
  readonly sort: SortState

  // ── Low-level setters (Updater<T> pattern) ──

  /** Replace or update the entire filters array for this layer. */
  setFilters: (updater: Updater<FiltersState>, context?: TContext) => void
  /** Replace or update the entire sort array for this layer. */
  setSort: (updater: Updater<SortState>, context?: TContext) => void

  // ── Filter helpers ──

  addFilterValue: <TType extends OptionBasedColumnDataType>(
    column: Column<TData, TType>,
    values: FilterModel<TType>['values'],
    context?: TContext,
  ) => void

  removeFilterValue: <TType extends OptionBasedColumnDataType>(
    column: Column<TData, TType>,
    value: FilterModel<TType>['values'],
    context?: TContext,
  ) => void

  setFilterValue: <TType extends ColumnDataType>(
    column: Column<TData, TType>,
    values: FilterModel<TType>['values'],
    context?: TContext,
  ) => void

  setFilterOperator: (
    columnId: string,
    operator: string,
    context?: TContext,
  ) => void

  removeFilter: (columnId: string, context?: TContext) => void

  removeAllFilters: (context?: TContext) => void

  // ── Sort helpers ──

  toggleColumnSort: (columnId: string, context?: TContext) => void
  setCustomSort: (id: string, enabled: boolean, context?: TContext) => void
  clearSort: (context?: TContext) => void
}

/**
 * The base view layer — defines the view's identity (the "you are here" context).
 * Extends `ViewLayer` with `load()` for swapping the entire base view
 * and metadata (`id`, `name`).
 */
export interface BaseViewLayer<TData, TContext = any>
  extends ViewLayer<TData, TContext> {
  /** The view ID (e.g. 'backlog', 'my-issues'). */
  readonly id?: string
  /** Human-readable name for the view. */
  readonly name?: string

  /**
   * Load a complete view as the new base. Replaces the entire base state
   * and resets the overrides layer to empty.
   */
  load: (view: DataViewState, context?: TContext) => void
}

/**
 * The user overrides layer — ephemeral refinements on top of the base view.
 * These are what appear in the filter bar / sort controls.
 * Extends `ViewLayer` with `reset()` to clear all overrides.
 */
export interface OverridesLayer<TData, TContext = any>
  extends ViewLayer<TData, TContext> {
  /** Clear all user overrides (filters + sort), returning to just the base view. */
  reset: (context?: TContext) => void
}

// ── Batch Actions ──────────────────────────────────────────

/** Actions available inside a `batch()` callback. Operates on the overrides layer. */
export interface BatchActions {
  addFilterValue: <TType extends OptionBasedColumnDataType>(
    column: Column<any, TType>,
    values: FilterModel<TType>['values'],
  ) => void

  removeFilterValue: <TType extends OptionBasedColumnDataType>(
    column: Column<any, TType>,
    value: FilterModel<TType>['values'],
  ) => void

  setFilterValue: <TType extends ColumnDataType>(
    column: Column<any, TType>,
    values: FilterModel<TType>['values'],
  ) => void

  setFilterOperator: (columnId: string, operator: string) => void

  removeFilter: (columnId: string) => void

  removeAllFilters: () => void

  setSort: (newSort: SortState) => void

  toggleColumnSort: (columnId: string) => void

  setCustomSort: (id: string, enabled: boolean) => void

  clearSort: () => void
}

// ── DataView Options ───────────────────────────────────────

export interface DataViewOptions<
  TData,
  TColumns extends ReadonlyArray<ColumnConfig<TData, any, any, any>>,
  TStrategy extends FilterStrategy,
  TContext = any,
> {
  strategy: TStrategy
  data: TData[]
  columnsConfig: TColumns

  // ── Base view (the view definition / "you are here" context) ──

  /** Initial base view state (uncontrolled). */
  defaultBaseView?: DataViewState
  /** Controlled base view state. Must be paired with `onBaseViewChange`. */
  baseView?: DataViewState
  /** Callback when the base view changes (controlled mode). */
  onBaseViewChange?:
    | ((view: DataViewState) => void)
    | DataViewStateUpdaterFn<TContext>

  // ── User overrides (ephemeral layer shown in the filter bar) ──

  /** Initial overrides state (uncontrolled). */
  defaultOverrides?: DataViewState
  /** Controlled overrides state. Must be paired with `onOverridesChange`. */
  overrides?: DataViewState
  /** Callback when user overrides change (controlled mode). */
  onOverridesChange?:
    | ((view: DataViewState) => void)
    | DataViewStateUpdaterFn<TContext>

  // ── Column options / faceted data ──

  options?: Partial<
    Record<OptionColumnIds<TColumns>, ColumnOption[] | undefined>
  >
  faceted?: FacetedColumnData<TColumns>
  entityName?: string
}

// ── DataView Instance ──────────────────────────────────────

export interface DataViewInstance<
  TData,
  TStrategy extends FilterStrategy,
  TContext,
> {
  /** All resolved columns, with state-aware helpers attached. */
  columns: Column<TData>[]

  // ── Two-layer state ──

  /**
   * The base view layer — defines what subset of data this view represents.
   * Filters/sort here are implicit (not shown in the filter bar).
   */
  baseView: BaseViewLayer<TData, TContext>

  /**
   * The user overrides layer — ephemeral refinements on top of the base.
   * Filters/sort here are what the UI filter bar displays.
   */
  overrides: OverridesLayer<TData, TContext>

  // ── Effective (merged) state ──

  /** Merged filters: base + overrides (override wins per-column). */
  filters: FiltersState
  /** Effective sort: overrides.sort if non-empty, else baseView.sort. */
  sort: SortState
  /** The merged effective view state (for serialization / debugging). */
  view: DataViewState

  /**
   * The data after applying merged filters and effective sort.
   *
   * - **`strategy: 'client'`** — filtered and sorted automatically using
   *   column accessors and operator match functions.
   * - **`strategy: 'server'`** — the original `data` array, unmodified
   *   (filtering/sorting is expected to happen server-side).
   */
  processedData: TData[]

  // ── Utilities ──

  /**
   * Captures a snapshot of the current **merged** state.
   * Useful for saving the combined base + overrides as a new preset view.
   */
  snapshot: (
    meta?: { id?: string; name?: string; meta?: DataViewStateMeta },
    context?: TContext,
  ) => DataViewState

  /**
   * Applies multiple mutations to the **overrides** layer atomically
   * (single state update / re-render).
   */
  batch: (
    callback: (batchActions: BatchActions) => void,
    context?: TContext,
  ) => void

  strategy: TStrategy
  entityName?: string
}
