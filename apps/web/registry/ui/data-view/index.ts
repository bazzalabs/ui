// @bazza-ui/registry-data-view
// Data view filter, sort, and view management primitives.

export type { FilterBarProps } from './components/filter/filter-bar'
export type { FilterMenuProps } from './components/filter/filter-menu'
// ── Types ───────────────────────────────────────────────────
export type {
  DataViewContextValue,
  DataViewFilterItemContextValue,
} from './components/provider/data-view-context'
export type { DataViewProviderProps } from './components/provider/data-view-provider'
export type { SortItemProps } from './components/sort/sort-item'
export type { SortMenuProps } from './components/sort/sort-menu'
export type { SortToggleProps } from './components/sort/sort-toggle'
export type { ViewSwitcherProps } from './components/view/view-switcher'

// ── Compound Export ─────────────────────────────────────────
export * as DataView from './index.parts'
