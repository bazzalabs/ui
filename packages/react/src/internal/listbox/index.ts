// ============================================================================
// Internal Listbox Package
// ============================================================================
// Core primitives for building listbox-like components.
// Used by: DropdownMenu, ContextMenu, Select, CommandMenu

export type { GroupContextValue } from './contexts/group-context.js'
export {
  GroupContext,
  useGroupContext,
} from './contexts/group-context.js'
export type { ItemContextValue } from './contexts/item-context.js'
export {
  ItemContext,
  useItemContext,
  useMaybeItemContext,
} from './contexts/item-context.js'
export type {
  ListboxContextValue,
  VirtualizationConfig,
} from './contexts/listbox-context.js'
// Contexts
export {
  ListboxContext as ListboxContextProvider,
  useListboxContext,
  useMaybeListboxContext,
} from './contexts/listbox-context.js'
// Row Width Measurement
export type { RowWidthContextValue } from './contexts/row-width-context.js'
export {
  RowWidthContext,
  useMaybeRowWidthContext,
  useRowWidthContext,
} from './contexts/row-width-context.js'
export type { SurfaceContextValue } from './contexts/surface-context.js'
export {
  SurfaceContext,
  useMaybeSurfaceContext,
  useSurfaceContext,
} from './contexts/surface-context.js'
export type {
  AimGuardRefs,
  UseListboxItemParams,
  UseListboxItemReturn,
} from './hooks/use-listbox-item.js'
// Hooks
export { useListboxItem } from './hooks/use-listbox-item.js'
export type {
  FocusOwnerInterface,
  SubmenuInterface,
  UseListboxKeyboardParams,
  UseListboxKeyboardReturn,
} from './hooks/use-listbox-keyboard.js'
export { useListboxKeyboard } from './hooks/use-listbox-keyboard.js'
export type {
  UseStickyRowWidthOptions,
  UseStickyRowWidthReturn,
} from './hooks/use-sticky-row-width.js'
export { useStickyRowWidth } from './hooks/use-sticky-row-width.js'
export type {
  Context,
  DOMRefs,
  FilterFn,
  HighlightSource,
  ItemRegistration,
  ListboxContext,
  ListboxState,
  State,
  VirtualItem,
} from './store/ListboxStore.js'
// Store
export { ListboxStore } from './store/ListboxStore.js'
// Utils
export { commandScore, defaultFilter } from './utils/command-score.js'
