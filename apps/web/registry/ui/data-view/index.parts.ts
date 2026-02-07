// Compound component parts — import as `import { DataView } from '@/registry/ui/data-view'`
// Usage: <DataView.Provider>, <DataView.FilterBar>, <DataView.SortMenu>, etc.

export { FilterActions } from './components/filter/filter-actions'
// ── Filter ──────────────────────────────────────────────────
export { FilterBar } from './components/filter/filter-bar'
export { FilterItem } from './components/filter/filter-item'
export { FilterMenu } from './components/filter/filter-menu'
export { FilterOperator } from './components/filter/filter-operator'
export { FilterRemove } from './components/filter/filter-remove'
export { FilterSubject } from './components/filter/filter-subject'
export { FilterValue } from './components/filter/filter-value'
export {
  DataViewContext as Context,
  DataViewFilterItemContext as FilterItemContext,
  useDataViewColumns,
  useDataViewContext,
  useDataViewFilterItemContext,
  useDataViewInstance,
  useDataViewLayer,
} from './components/provider/data-view-context'
// ── Provider ────────────────────────────────────────────────
export { DataViewProvider as Provider } from './components/provider/data-view-provider'
export { SortItem } from './components/sort/sort-item'
// ── Sort ────────────────────────────────────────────────────
export { SortMenu } from './components/sort/sort-menu'
export { SortToggle } from './components/sort/sort-toggle'

// ── View ────────────────────────────────────────────────────
export { ViewSwitcher } from './components/view/view-switcher'
