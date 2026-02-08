// Compound component parts — import as `import { DataView } from '@/registry/ui/data-view'`
// Usage: <DataView.Provider>, <DataView.List>, <DataView.Menu>, etc.

// ── Actions ──────────────────────────────────────────────────
export { FilterActions as Actions } from './components/actions/filter-actions'

// ── Item Components ──────────────────────────────────────────
export {
  FilterItem as Item,
  useFilterItemContext,
} from './components/item/filter-item'
export { FilterOperator as Operator } from './components/item/filter-operator'
export { FilterRemove as Remove } from './components/item/filter-remove'
export { FilterSubject as Subject } from './components/item/filter-subject'
export { FilterValue as Value } from './components/item/filter-value'

// ── List ─────────────────────────────────────────────────────
export { FilterList as List } from './components/list/filter-list'
export { FilterListMobileContainer as ListMobileContainer } from './components/list/filter-list-mobile-container'

// ── Menu and Trigger ─────────────────────────────────────────
export { FilterMenu as Menu } from './components/menu/filter-menu'
// ── Provider ─────────────────────────────────────────────────
export { DataViewProvider as Provider } from './components/provider/data-view-provider'
// ── Context Exports ──────────────────────────────────────────
export {
  DataViewContext as Context,
  useDataViewColumn,
  useDataViewColumns,
  useDataViewContext,
  useDataViewEntityName,
  useDataViewFilters,
  useDataViewInstance,
  useDataViewLayer,
  useDataViewLocale,
  useDataViewSort,
  useDataViewStrategy,
  useDataViewVariant,
} from './components/root/data-view-context'
// ── Root ─────────────────────────────────────────────────────
export { DataViewRoot as Root } from './components/root/data-view-root'
// ── Sort ─────────────────────────────────────────────────────
export { SortItem } from './components/sort/sort-item'
export { SortMenu } from './components/sort/sort-menu'
export { SortToggle } from './components/sort/sort-toggle'
export { FilterTrigger as Trigger } from './components/trigger/filter-trigger'
// ── Value Utilities (for advanced usage) ─────────────────────
export {
  // Menu creators
  createMultiOptionMenu,
  // Render functions for custom item rendering
  createOptionItemRenderer,
  createOptionMenu,
  createSelectableMenu,
  // Text filter utilities
  createTextFilterItems,
  createTextItemRenderer,
  // Controllers
  FilterValueDateController,
  FilterValueNumberController,
  // Shared editor content components (for custom menu implementations)
  OptionEditorContent,
  renderOptionItem,
  renderTextItem,
  TextEditorContent,
} from './components/value'
// ── View ─────────────────────────────────────────────────────
export { ViewSwitcher } from './components/view/view-switcher'
