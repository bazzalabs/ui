// ============================================================================
// Combobox Exports
// ============================================================================

// Namespace export
export * as Combobox from './index.parts.js'

// ============================================================================
// Combobox-specific components
// ============================================================================

// Clear
export type { ComboboxClearProps, ComboboxClearState } from './clear/clear.js'
export { ComboboxClear } from './clear/clear.js'
// Positioner Context
export type {
  ComboboxLayout,
  ComboboxPositionerContextValue,
} from './contexts/combobox-positioner-context.js'
export { useComboboxPositionerContext } from './contexts/combobox-positioner-context.js'
// Input
export { ComboboxInputDataAttributes } from './input/input.data-attrs.js'
export type {
  ComboboxInputCursorBehavior,
  ComboboxInputProps,
  ComboboxInputState,
} from './input/input.js'
export { ComboboxInput } from './input/input.js'
// Input Wrapper
export { ComboboxInputWrapperDataAttributes } from './input-wrapper/input-wrapper.data-attrs.js'
export type {
  ComboboxInputWrapperProps,
  ComboboxInputWrapperState,
} from './input-wrapper/input-wrapper.js'
export { ComboboxInputWrapper } from './input-wrapper/input-wrapper.js'
// Item
export { ComboboxItemDataAttributes } from './item/item.data-attrs.js'
export type { ComboboxItemProps, ComboboxItemState } from './item/item.js'
export { ComboboxItem } from './item/item.js'
// Item Indicator
export { ComboboxItemIndicatorDataAttributes } from './item-indicator/item-indicator.data-attrs.js'
export type {
  ComboboxItemIndicatorProps,
  ComboboxItemIndicatorState,
} from './item-indicator/item-indicator.js'
export { ComboboxItemIndicator } from './item-indicator/item-indicator.js'
// Item Label
export type { ComboboxItemLabelProps } from './item-label/item-label.js'
export { ComboboxItemLabel } from './item-label/item-label.js'
// Positioner
export type { ComboboxPositionerProps } from './positioner/positioner.js'
export { ComboboxPositioner } from './positioner/positioner.js'
// Root
export type { ComboboxRootProps } from './root/root.js'
export { ComboboxRoot } from './root/root.js'
// Surface
export type { ComboboxSurfaceProps } from './surface/surface.js'
export { ComboboxSurface } from './surface/surface.js'

// ============================================================================
// Re-exported from internal/popup-menu (with Combobox prefix)
// ============================================================================

export type {
  PopupMenuArrow as ComboboxArrow,
  PopupMenuArrowProps as ComboboxArrowProps,
  PopupMenuBackdrop as ComboboxBackdrop,
  PopupMenuBackdropProps as ComboboxBackdropProps,
  PopupMenuEmpty as ComboboxEmpty,
  PopupMenuEmptyProps as ComboboxEmptyProps,
  PopupMenuEmptyState as ComboboxEmptyState,
  PopupMenuGroup as ComboboxGroup,
  PopupMenuGroupLabel as ComboboxGroupLabel,
  PopupMenuGroupLabelProps as ComboboxGroupLabelProps,
  PopupMenuGroupLabelState as ComboboxGroupLabelState,
  PopupMenuGroupProps as ComboboxGroupProps,
  PopupMenuGroupState as ComboboxGroupState,
  PopupMenuIconProps as ComboboxIconProps,
  PopupMenuIconState as ComboboxIconState,
  PopupMenuList as ComboboxList,
  PopupMenuListChildrenState as ComboboxListChildrenState,
  PopupMenuListProps as ComboboxListProps,
  PopupMenuListState as ComboboxListState,
  PopupMenuPopup as ComboboxPopup,
  PopupMenuPopupProps as ComboboxPopupProps,
  PopupMenuPortal as ComboboxPortal,
  PopupMenuPortalProps as ComboboxPortalProps,
  PopupMenuScrollArrowProps as ComboboxScrollArrowProps,
  PopupMenuScrollArrowState as ComboboxScrollArrowState,
  PopupMenuScrollDownArrowProps as ComboboxScrollDownArrowProps,
  PopupMenuScrollUpArrowProps as ComboboxScrollUpArrowProps,
  PopupMenuSeparator as ComboboxSeparator,
  PopupMenuSeparatorProps as ComboboxSeparatorProps,
  PopupMenuSeparatorState as ComboboxSeparatorState,
  PopupMenuSurfaceState as ComboboxSurfaceState,
} from '../internal/popup-menu/index.js'

export {
  PopupMenuArrowDataAttributes as ComboboxArrowDataAttributes,
  PopupMenuBackdropDataAttributes as ComboboxBackdropDataAttributes,
  PopupMenuIconDataAttributes as ComboboxIconDataAttributes,
  PopupMenuListCssVars as ComboboxListCssVars,
  PopupMenuListDataAttributes as ComboboxListDataAttributes,
  PopupMenuPopupDataAttributes as ComboboxPopupDataAttributes,
  PopupMenuPositionerCssVars as ComboboxPositionerCssVars,
  PopupMenuPositionerDataAttributes as ComboboxPositionerDataAttributes,
  PopupMenuScrollArrowDataAttributes as ComboboxScrollArrowDataAttributes,
} from '../internal/popup-menu/index.js'

// ============================================================================
// Context hooks (for advanced usage)
// ============================================================================

// Also re-export listbox context hooks for Surface configuration
export type { SurfaceContextValue } from '../internal/listbox/index.js'
export {
  useMaybeSurfaceContext,
  useSurfaceContext,
} from '../internal/listbox/index.js'

export type { ComboboxContextValue } from './contexts/combobox-context.js'
export {
  useComboboxContext,
  useMaybeComboboxContext,
} from './contexts/combobox-context.js'

export type { ComboboxItemContextValue } from './item/item-context.js'
export {
  useComboboxItemContext,
  useMaybeComboboxItemContext,
} from './item/item-context.js'

// ============================================================================
// Store (for advanced usage)
// ============================================================================

export type {
  FilterFn as ComboboxFilterFn,
  ItemRegistration as ComboboxItemRegistration,
  ListboxContext as ComboboxStoreContext,
  ListboxState as ComboboxStoreState,
  VirtualItem as ComboboxVirtualItem,
} from '../internal/listbox/index.js'
export { ListboxStore as ComboboxStore } from '../internal/listbox/index.js'

// ============================================================================
// Filter utilities
// ============================================================================

export { commandScore, defaultFilter } from '../internal/listbox/index.js'
