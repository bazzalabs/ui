// @bazza-ui/registry-data-view
// Data view filter, sort, and view management primitives.

// ── Type Exports ─────────────────────────────────────────────
export type { FilterActionsProps } from './components/actions/filter-actions'
export type {
  FilterItemContextValue,
  FilterItemProps,
} from './components/item/filter-item'
export type { FilterOperatorProps } from './components/item/filter-operator'
export type { FilterRemoveProps } from './components/item/filter-remove'
export type { FilterSubjectProps } from './components/item/filter-subject'
export type {
  FilterValueDisplayProps,
  FilterValueProps,
} from './components/item/filter-value'
export type { FilterListProps } from './components/list/filter-list'
export type { FilterListMobileContainerProps } from './components/list/filter-list-mobile-container'
export type { FilterMenuProps } from './components/menu/filter-menu'
export type { DataViewProviderProps } from './components/provider/data-view-provider'
export type {
  DataViewContextValue,
  DataViewVariant,
} from './components/root/data-view-context'
export type { DataViewRootProps } from './components/root/data-view-root'
export type { SortItemProps } from './components/sort/sort-item'
export type { SortMenuProps } from './components/sort/sort-menu'
export type { SortToggleProps } from './components/sort/sort-toggle'
export type { FilterTriggerProps } from './components/trigger/filter-trigger'
// Value editor types
export type { OptionEditorContentProps } from './components/value/editors/option-editor'
export type { TextEditorContentProps } from './components/value/editors/text-editor'
export type {
  CreateMultiOptionMenuProps,
  CreateMultiOptionMenuResult,
  CreateOptionMenuProps,
  CreateOptionMenuResult,
  CreateSelectableMenuResult,
  SelectableColumnType,
} from './components/value/selectable-menu'
export type { FilterValueControllerProps } from './components/value/types'
export type { ViewSwitcherProps } from './components/view/view-switcher'

// ── Compound Export ──────────────────────────────────────────
export * as DataView from './index.parts'
