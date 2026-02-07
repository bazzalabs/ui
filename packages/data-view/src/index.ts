// @bazza-ui/data-view — Core (framework-agnostic)
// This is the main entry point. No React imports here.

// ── Types ──────────────────────────────────────────────────

export type {
  // View layers
  BaseViewLayer,
  BatchActions,
  BigIntColumnId,
  BigIntColumnIds,
  // Column data types
  BuiltInColumnDataType,
  Column,
  // Column config
  ColumnConfig,
  ColumnDataNativeMap,
  ColumnDataType,
  ColumnMeta,
  // Column option
  ColumnOption,
  ColumnOptionExtended,
  ColumnPrivateProperties,
  ColumnProperties,
  ColumnSort,
  ColumnStateProperties,
  CustomSort,
  DataViewInstance,
  // Hook types
  DataViewOptions,
  // View
  DataViewState,
  DataViewStateMeta,
  DataViewStateUpdaterFn,
  // Utility types
  ElementType,
  // Faceted
  FacetedColumnData,
  // Filter
  FilterModel,
  FilterStrategy,
  FiltersState,
  FilterValues,
  // Min/Max
  MinMaxReturn,
  Nullable,
  NumberColumnId,
  NumberColumnIds,
  NumericValue,
  OptionBasedColumnDataType,
  // Column ID utilities
  OptionColumnId,
  OptionColumnIds,
  // Order functions
  OrderDirection,
  OverridesLayer,
  // Sort
  SortDirection,
  SortRule,
  SortState,
  // Accessor / Transform functions
  TAccessorFn,
  TBuiltInOrderFn,
  TBuiltInOrderFnName,
  TCustomOrderFn,
  TOrderFn,
  TOrderFnArg,
  TOrderFns,
  TTransformOptionsFn,
  TTransformValueToOptionFn,
  Updater,
  ViewLayer,
} from './core/types.js'

// ── Column Builder ─────────────────────────────────────────

export { ColumnBuilder, createColumnBuilder } from './core/columns/index.js'

// ── Column Factory ─────────────────────────────────────────

export { createColumn, createColumns } from './core/columns/index.js'

// ── Column Data Service ────────────────────────────────────

export { ColumnDataService } from './core/columns/index.js'

// ── Array Utilities ────────────────────────────────────────

export {
  addUniq,
  flatten,
  intersection,
  isAnyOf,
  max,
  min,
  minMax,
  removeUniq,
  take,
  uniq,
} from './lib/array.js'

// ── Helpers ────────────────────────────────────────────────

export {
  createBigIntFilterValue,
  createBigIntRange,
  createDateFilterValue,
  createDateRange,
  createNumberFilterValue,
  createNumberRange,
  filterData,
  filterRow,
  getColumn,
  getValidBigInt,
  getValidNumber,
  isColumnOption,
  isColumnOptionArray,
  isColumnOptionMap,
  isMinMaxTuple,
  isStringArray,
  isValidNumber,
} from './lib/helpers.js'

// ── Memo ───────────────────────────────────────────────────

export { memo } from './lib/memo.js'

// ── Order Functions ────────────────────────────────────────

export {
  applyOrderFns,
  isBuiltInOrderFnName,
  isBuiltInOrderFnTuple,
  isCustomOrderFn,
  isOrderDirection,
  isOrderFnArg,
  orderFns,
} from './lib/order-fns.js'

// ── Type Guards ────────────────────────────────────────────

export {
  isBigIntColumn,
  isBigIntFilter,
  isBooleanColumn,
  isBooleanFilter,
  isColumnType,
  isDateColumn,
  isDateFilter,
  isFilterType,
  isMultiOptionColumn,
  isMultiOptionFilter,
  isNumberColumn,
  isNumberFilter,
  isNumericColumn,
  isNumericFilter,
  isOptionBasedColumn,
  isOptionBasedFilter,
  isOptionColumn,
  isOptionFilter,
  isTextColumn,
  isTextFilter,
} from './lib/type-guards.js'

// ── i18n ───────────────────────────────────────────────────

export type { Locale } from './lib/i18n.js'
export { t } from './lib/i18n.js'

// ── Column Types ───────────────────────────────────────────

export type { ColumnType, ColumnTypeConfig } from './core/column-types.js'
export {
  bigIntType,
  booleanType,
  builtInColumnTypes,
  dateType,
  defineColumnType,
  multiOptionType,
  numberType,
  optionType,
  textType,
} from './core/column-types.js'

// ── Operator System ────────────────────────────────────────

export { defineOperators, OperatorSet } from './core/operator-set.js'
export {
  bigIntOperators,
  booleanOperators,
  dateOperators,
  defaultOperatorSets,
  multiOptionOperators,
  numberOperators,
  optionOperators,
  textOperators,
} from './core/operator-sets.js'
export type {
  OperatorDefinition,
  OperatorDefinitionInput,
} from './core/types.js'

// ── Operator Utilities ─────────────────────────────────────

export { determineNewOperator, getOperatorSet } from './core/operators.js'

// ── Filter Operations ──────────────────────────────────────

export { filterOperations } from './core/filters.js'

// ── Sort Operations ─────────────────────────────────────────

export { sortOperations } from './core/sort.js'

// ── View Operations ─────────────────────────────────────────

export { mergeFilters, mergeSort, viewOperations } from './core/view.js'

// ── Client-side Processing ──────────────────────────────────

export {
  compareValues,
  filterDataByColumns,
  filterRowByColumns,
  processData,
  sortDataByColumns,
} from './core/client.js'

// ── Serialization ───────────────────────────────────────────

export type { SerializeOptions } from './lib/serialize.js'
export { deserializeView, serializeView } from './lib/serialize.js'
