// @bazza-ui/data-views — Core (framework-agnostic)
// This is the main entry point. No React imports here.

// ── Types ──────────────────────────────────────────────────

export type * from './core/types.js'

// ── Filter Tree ────────────────────────────────────────────

export * from './core/filter-tree.js'

// ── Sort Operations ────────────────────────────────────────

export * from './core/sort.js'

// ── View Operations ────────────────────────────────────────

export * from './core/view.js'

// ── Client Processing ──────────────────────────────────────

export * from './core/client.js'

// ── Array Utilities ────────────────────────────────────────

export * from './lib/array.js'

// ── Helpers ────────────────────────────────────────────────

export * from './lib/helpers.js'

// ── Memo ───────────────────────────────────────────────────

export * from './lib/memo.js'

// ── Order Functions ────────────────────────────────────────

export * from './lib/order-fns.js'

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

// ── Operator Utilities ─────────────────────────────────────

export { determineNewOperator, getOperatorSet } from './core/operators.js'
