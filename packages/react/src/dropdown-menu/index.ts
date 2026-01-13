// ============================================================================
// Dropdown Menu Exports
// ============================================================================

// Namespace export
export * as DropdownMenu from './index.parts.js'

// ============================================================================
// Dropdown-menu specific components
// ============================================================================

// Root
export type { DropdownMenuRoot } from './root/root.js'

// Trigger
export { DropdownMenuTriggerDataAttributes } from './trigger/trigger.data-attrs.js'
export type { DropdownMenuTrigger } from './trigger/trigger.js'

// ============================================================================
// Re-exported from internal/popup-menu (with DropdownMenu prefix)
// ============================================================================

// Portal
// Submenu
// Surface
// List
// Input
// Empty
// Group
// Group Label
// Separator
export type {
  PopupMenuArrow as DropdownMenuArrow,
  PopupMenuArrowProps as DropdownMenuArrowProps,
  PopupMenuBackdrop as DropdownMenuBackdrop,
  PopupMenuBackdropProps as DropdownMenuBackdropProps,
  PopupMenuCheckboxItem as DropdownMenuCheckboxItem,
  PopupMenuCheckboxItemIndicator as DropdownMenuCheckboxItemIndicator,
  PopupMenuCheckboxItemIndicatorProps as DropdownMenuCheckboxItemIndicatorProps,
  PopupMenuCheckboxItemIndicatorState as DropdownMenuCheckboxItemIndicatorState,
  PopupMenuCheckboxItemProps as DropdownMenuCheckboxItemProps,
  PopupMenuCheckboxItemState as DropdownMenuCheckboxItemState,
  PopupMenuEmpty as DropdownMenuEmpty,
  PopupMenuEmptyProps as DropdownMenuEmptyProps,
  PopupMenuEmptyState as DropdownMenuEmptyState,
  PopupMenuGroup as DropdownMenuGroup,
  PopupMenuGroupLabel as DropdownMenuGroupLabel,
  PopupMenuGroupLabelProps as DropdownMenuGroupLabelProps,
  PopupMenuGroupLabelState as DropdownMenuGroupLabelState,
  PopupMenuGroupProps as DropdownMenuGroupProps,
  PopupMenuGroupState as DropdownMenuGroupState,
  PopupMenuIcon as DropdownMenuIcon,
  PopupMenuIconProps as DropdownMenuIconProps,
  PopupMenuIconState as DropdownMenuIconState,
  PopupMenuInput as DropdownMenuInput,
  PopupMenuInputProps as DropdownMenuInputProps,
  PopupMenuInputState as DropdownMenuInputState,
  PopupMenuItem as DropdownMenuItem,
  PopupMenuItemProps as DropdownMenuItemProps,
  PopupMenuItemState as DropdownMenuItemState,
  PopupMenuList as DropdownMenuList,
  PopupMenuListChildrenState as DropdownMenuListChildrenState,
  PopupMenuListProps as DropdownMenuListProps,
  PopupMenuListState as DropdownMenuListState,
  PopupMenuPopup as DropdownMenuPopup,
  PopupMenuPopupProps as DropdownMenuPopupProps,
  PopupMenuPortal as DropdownMenuPortal,
  PopupMenuPortalProps as DropdownMenuPortalProps,
  PopupMenuPositioner as DropdownMenuPositioner,
  PopupMenuPositionerProps as DropdownMenuPositionerProps,
  PopupMenuRadioGroup as DropdownMenuRadioGroup,
  PopupMenuRadioGroupProps as DropdownMenuRadioGroupProps,
  PopupMenuRadioGroupState as DropdownMenuRadioGroupState,
  PopupMenuRadioItem as DropdownMenuRadioItem,
  PopupMenuRadioItemIndicator as DropdownMenuRadioItemIndicator,
  PopupMenuRadioItemIndicatorProps as DropdownMenuRadioItemIndicatorProps,
  PopupMenuRadioItemIndicatorState as DropdownMenuRadioItemIndicatorState,
  PopupMenuRadioItemProps as DropdownMenuRadioItemProps,
  PopupMenuRadioItemState as DropdownMenuRadioItemState,
  PopupMenuScrollArrowProps as DropdownMenuScrollArrowProps,
  PopupMenuScrollArrowState as DropdownMenuScrollArrowState,
  PopupMenuScrollDownArrowProps as DropdownMenuScrollDownArrowProps,
  PopupMenuScrollUpArrowProps as DropdownMenuScrollUpArrowProps,
  PopupMenuSeparator as DropdownMenuSeparator,
  PopupMenuSeparatorProps as DropdownMenuSeparatorProps,
  PopupMenuSeparatorState as DropdownMenuSeparatorState,
  PopupMenuShortcut as DropdownMenuShortcut,
  PopupMenuShortcutProps as DropdownMenuShortcutProps,
  PopupMenuShortcutState as DropdownMenuShortcutState,
  PopupMenuSubmenuRoot as DropdownMenuSubmenuRoot,
  PopupMenuSubmenuRootProps as DropdownMenuSubmenuRootProps,
  PopupMenuSubmenuTrigger as DropdownMenuSubmenuTrigger,
  PopupMenuSubmenuTriggerIndicator as DropdownMenuSubmenuTriggerIndicator,
  PopupMenuSubmenuTriggerIndicatorProps as DropdownMenuSubmenuTriggerIndicatorProps,
  PopupMenuSubmenuTriggerIndicatorState as DropdownMenuSubmenuTriggerIndicatorState,
  PopupMenuSubmenuTriggerProps as DropdownMenuSubmenuTriggerProps,
  PopupMenuSubmenuTriggerState as DropdownMenuSubmenuTriggerState,
  PopupMenuSurface as DropdownMenuSurface,
  PopupMenuSurfaceProps as DropdownMenuSurfaceProps,
  PopupMenuSurfaceState as DropdownMenuSurfaceState,
} from '../internal/popup-menu/index.js'
// Arrow
// Backdrop
// Popup
// Positioner
// Item
// Checkbox Item
// Radio Group
// Radio Item
// Submenu Trigger
// Shortcut
export {
  PopupMenuArrowDataAttributes as DropdownMenuArrowDataAttributes,
  PopupMenuBackdropDataAttributes as DropdownMenuBackdropDataAttributes,
  PopupMenuCheckboxItemDataAttributes as DropdownMenuCheckboxItemDataAttributes,
  PopupMenuIconDataAttributes as DropdownMenuIconDataAttributes,
  PopupMenuItemDataAttributes as DropdownMenuItemDataAttributes,
  PopupMenuPopupDataAttributes as DropdownMenuPopupDataAttributes,
  PopupMenuPositionerCssVars as DropdownMenuPositionerCssVars,
  PopupMenuPositionerDataAttributes as DropdownMenuPositionerDataAttributes,
  PopupMenuRadioGroupDataAttributes as DropdownMenuRadioGroupDataAttributes,
  PopupMenuRadioItemDataAttributes as DropdownMenuRadioItemDataAttributes,
  PopupMenuScrollArrowDataAttributes as DropdownMenuScrollArrowDataAttributes,
  PopupMenuShortcutDataAttributes as DropdownMenuShortcutDataAttributes,
  PopupMenuSubmenuTriggerDataAttributes as DropdownMenuSubmenuTriggerDataAttributes,
} from '../internal/popup-menu/index.js'

// ============================================================================
// Context hooks (for advanced usage)
// ============================================================================

export type {
  ItemContextValue,
  SurfaceContextValue,
} from '../internal/listbox/index.js'
export {
  useItemContext,
  useMaybeItemContext,
  useMaybeSurfaceContext,
  useSurfaceContext,
} from '../internal/listbox/index.js'
export type { PopupMenuContextValue as RootContextValue } from '../internal/popup-menu/index.js'
export {
  useMaybePopupMenuContext as useMaybeRootContext,
  usePopupMenuContext as useRootContext,
} from '../internal/popup-menu/index.js'

// ============================================================================
// Store (for advanced usage)
// ============================================================================

export type {
  FilterFn as DropdownMenuFilterFn,
  ItemRegistration as DropdownMenuItemRegistration,
  ListboxContext as DropdownMenuStoreContext,
  ListboxState as DropdownMenuStoreState,
  VirtualItem as DropdownMenuVirtualItem,
} from '../internal/listbox/index.js'
export { ListboxStore as DropdownMenuStore } from '../internal/listbox/index.js'

// ============================================================================
// Filter utilities
// ============================================================================

export { commandScore, defaultFilter } from '../internal/listbox/index.js'

// ============================================================================
// Hook for custom items (for advanced usage)
// ============================================================================

export type {
  UsePopupMenuItemParams as UseItemParams,
  UsePopupMenuItemReturn as UseItemReturn,
} from '../internal/popup-menu/index.js'
export { usePopupMenuItem as useItem } from '../internal/popup-menu/index.js'
