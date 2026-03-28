// ============================================================================
// Select Exports
// ============================================================================

// Namespace export
export * as Select from './index.parts.js'

// ============================================================================
// Select-specific components
// ============================================================================

// Item
export { SelectItemDataAttributes } from './item/item.data-attrs.js'
export type { SelectItemProps, SelectItemState } from './item/item.js'
export { SelectItem } from './item/item.js'
// Item Indicator
export { SelectItemIndicatorDataAttributes } from './item-indicator/item-indicator.data-attrs.js'
export type {
  SelectItemIndicatorProps,
  SelectItemIndicatorState,
} from './item-indicator/item-indicator.js'
export { SelectItemIndicator } from './item-indicator/item-indicator.js'
// Item Label (renamed from ItemText)
export type { SelectItemLabelProps } from './item-label/item-label.js'
export { SelectItemLabel } from './item-label/item-label.js'
// Popup (Select-specific with alignItemWithTriggerActive state)
export type { SelectPopupProps, SelectPopupState } from './popup/popup.js'
export { SelectPopup } from './popup/popup.js'
// Positioner (custom implementation with alignItemWithTrigger support)
export type { SelectPositionerProps } from './positioner/positioner.js'
export { SelectPositioner } from './positioner/positioner.js'
// Root
export type { SelectRootProps } from './root/root.js'
export { SelectRoot } from './root/root.js'
// Trigger
export { SelectTriggerDataAttributes } from './trigger/trigger.data-attrs.js'
export type {
  SelectTriggerProps,
  SelectTriggerState,
} from './trigger/trigger.js'
export { SelectTrigger } from './trigger/trigger.js'
// Value
export type { SelectValueProps, SelectValueState } from './value/value.js'
export { SelectValue } from './value/value.js'

// ============================================================================
// Re-exported from internal/popup-menu (with Select prefix)
// ============================================================================

// Portal
// Popup
// Backdrop
// Arrow
// Surface
// List
// Input
// Empty
// Group
// Group Label
// Separator
// Re-export state type from popup-menu
// Icon
// Scroll Arrows
export type {
  PopupMenuArrow as SelectArrow,
  PopupMenuArrowProps as SelectArrowProps,
  PopupMenuBackdrop as SelectBackdrop,
  PopupMenuBackdropProps as SelectBackdropProps,
  PopupMenuEmpty as SelectEmpty,
  PopupMenuEmptyProps as SelectEmptyProps,
  PopupMenuEmptyState as SelectEmptyState,
  PopupMenuGroup as SelectGroup,
  PopupMenuGroupLabel as SelectGroupLabel,
  PopupMenuGroupLabelProps as SelectGroupLabelProps,
  PopupMenuGroupLabelState as SelectGroupLabelState,
  PopupMenuGroupProps as SelectGroupProps,
  PopupMenuGroupState as SelectGroupState,
  PopupMenuIconProps as SelectIconProps,
  PopupMenuIconState as SelectIconState,
  PopupMenuInput as SelectInput,
  PopupMenuInputProps as SelectInputProps,
  PopupMenuInputState as SelectInputState,
  PopupMenuList as SelectList,
  PopupMenuListChildrenState as SelectListChildrenState,
  PopupMenuListProps as SelectListProps,
  PopupMenuListState as SelectListState,
  PopupMenuPortal as SelectPortal,
  PopupMenuPortalProps as SelectPortalProps,
  PopupMenuScrollArrowProps as SelectScrollArrowProps,
  PopupMenuScrollArrowState as SelectScrollArrowState,
  PopupMenuScrollDownArrowProps as SelectScrollDownArrowProps,
  PopupMenuScrollUpArrowProps as SelectScrollUpArrowProps,
  PopupMenuSeparator as SelectSeparator,
  PopupMenuSeparatorProps as SelectSeparatorProps,
  PopupMenuSeparatorState as SelectSeparatorState,
  PopupMenuSurfaceState as SelectSurfaceState,
} from '../internal/popup-menu/index.js'

export {
  PopupMenuListCssVars as SelectListCssVars,
  PopupMenuPositionerCssVars as SelectPositionerCssVars,
} from '../internal/popup-menu/index.js'

// Select-specific data attributes (with hardcoded bazzaui-select-* slot values)
export { SelectArrowDataAttributes } from './arrow/arrow.data-attrs.js'
export { SelectBackdropDataAttributes } from './backdrop/backdrop.data-attrs.js'
export { SelectEmptyDataAttributes } from './empty/empty.data-attrs.js'
export { SelectGroupDataAttributes } from './group/group.data-attrs.js'
export { SelectGroupLabelDataAttributes } from './group-label/group-label.data-attrs.js'
export { SelectIconDataAttributes } from './icon/icon.data-attrs.js'
export { SelectInputDataAttributes } from './input/input.data-attrs.js'
export { SelectListDataAttributes } from './list/list.data-attrs.js'
export { SelectPopupDataAttributes } from './popup/popup.data-attrs.js'
export { SelectPositionerDataAttributes } from './positioner/positioner.data-attrs.js'
export { SelectScrollArrowDataAttributes } from './scroll-arrow/scroll-arrow.data-attrs.js'
export { SelectSeparatorDataAttributes } from './separator/separator.data-attrs.js'
// Surface (Select-specific with alignItemWithTrigger support)
export type { SelectSurfaceProps } from './surface/surface.js'
export { SelectSurface } from './surface/surface.js'

// ============================================================================
// Context hooks (for advanced usage)
// ============================================================================

// Also re-export listbox context hooks for Surface configuration
export type { SurfaceContextValue } from '../internal/listbox/index.js'
export {
  useMaybeSurfaceContext,
  useSurfaceContext,
} from '../internal/listbox/index.js'
export type { SelectContextValue } from './contexts/select-context.js'
export {
  useMaybeSelectContext,
  useSelectContext,
} from './contexts/select-context.js'

export type {
  Align as SelectPositionerAlign,
  SelectPositionerContextValue,
  Side as SelectPositionerSide,
} from './contexts/select-positioner-context.js'
export { useSelectPositionerContext } from './contexts/select-positioner-context.js'
export type { SelectItemContextValue } from './item/item-context.js'
export {
  useMaybeSelectItemContext,
  useSelectItemContext,
} from './item/item-context.js'

// ============================================================================
// Store (for advanced usage)
// ============================================================================

export type {
  FilterFn as SelectFilterFn,
  ItemRegistration as SelectItemRegistration,
  ListboxContext as SelectStoreContext,
  ListboxState as SelectStoreState,
  VirtualItem as SelectVirtualItem,
} from '../internal/listbox/index.js'
export { ListboxStore as SelectStore } from '../internal/listbox/index.js'

// ============================================================================
// Filter utilities
// ============================================================================

export { commandScore, defaultFilter } from '../internal/listbox/index.js'
