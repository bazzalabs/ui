// ============================================================================
// Internal Popup Menu Package
// ============================================================================
// Shared behavior for popup-based menus with submenus.
// Used by: DropdownMenu, ContextMenu

// Contexts
export {
  FocusOwnerContext,
  useFocusOwner,
  useMaybeFocusOwner,
} from './contexts/focus-owner-context.js'
export {
  OpenChainContext,
  useMaybeOpenChain,
  useOpenChain,
} from './contexts/open-chain-context.js'
export type {
  PopupMenuContextValue,
  VirtualAnchor,
  VirtualItem,
  VirtualizationConfig,
} from './contexts/popup-menu-context.js'
// Core Context
export {
  PopupMenuContext,
  useMaybePopupMenuContext,
  usePopupMenuContext,
} from './contexts/popup-menu-context.js'
export type { SubmenuContextValue } from './contexts/submenu-context.js'
export {
  SubmenuContext,
  useMaybeSubmenuContext,
  useSubmenuContext,
} from './contexts/submenu-context.js'
export type {
  AimGuardContextValue,
  AimGuardProviderProps,
} from './hooks/use-aim-guard.js'
// Hooks
export {
  AimGuardCtx,
  AimGuardProvider,
  useAimGuard,
} from './hooks/use-aim-guard.js'
export type { FocusOwnerState } from './store/FocusOwnerStore.js'
// Stores
export { FocusOwnerStore } from './store/FocusOwnerStore.js'
export type { OpenChainState } from './store/OpenChainStore.js'
export { OpenChainStore } from './store/OpenChainStore.js'
export type { AnchorSide } from './utils/aim-guard.js'
// Utils
export {
  getSmoothedHeading,
  resolveAnchorSide,
  willHitSubmenu,
} from './utils/aim-guard.js'

export { useMouseTrail } from './utils/use-mouse-trail.js'

// ============================================================================
// Shared Hooks
// ============================================================================

export type {
  UsePopupMenuRootParams,
  UsePopupMenuRootReturn,
} from './hooks/use-popup-menu-root.js'
export { usePopupMenuRoot } from './hooks/use-popup-menu-root.js'

// ============================================================================
// Shared Components
// ============================================================================

export { PopupMenuArrowDataAttributes } from './components/arrow/arrow.data-attrs.js'
export type { PopupMenuArrowProps } from './components/arrow/arrow.js'
export { PopupMenuArrow } from './components/arrow/arrow.js'
export { PopupMenuBackdropDataAttributes } from './components/backdrop/backdrop.data-attrs.js'
export type { PopupMenuBackdropProps } from './components/backdrop/backdrop.js'
export { PopupMenuBackdrop } from './components/backdrop/backdrop.js'
export { PopupMenuPopupDataAttributes } from './components/popup/popup.data-attrs.js'
export type { PopupMenuPopupProps } from './components/popup/popup.js'
export { PopupMenuPopup } from './components/popup/popup.js'
export type { PopupMenuPortalProps } from './components/portal/portal.js'
export { PopupMenuPortal } from './components/portal/portal.js'
export { PopupMenuPositionerCssVars } from './components/positioner/positioner.css-vars.js'
export { PopupMenuPositionerDataAttributes } from './components/positioner/positioner.data-attrs.js'
export type { PopupMenuPositionerProps } from './components/positioner/positioner.js'
export { PopupMenuPositioner } from './components/positioner/positioner.js'
export type { PopupMenuProvidersProps } from './components/providers.js'
export { PopupMenuProviders } from './components/providers.js'

// ============================================================================
// Item Hooks
// ============================================================================

export type {
  UsePopupMenuItemParams,
  UsePopupMenuItemReturn,
} from './hooks/use-popup-menu-item.js'
export { usePopupMenuItem } from './hooks/use-popup-menu-item.js'
export type {
  UsePopupMenuKeyboardParams,
  UsePopupMenuKeyboardReturn,
} from './hooks/use-popup-menu-keyboard.js'
export { usePopupMenuKeyboard } from './hooks/use-popup-menu-keyboard.js'

// ============================================================================
// Trigger Components
// ============================================================================

export { PopupMenuIconDataAttributes } from './components/icon/icon.data-attrs.js'
export type {
  PopupMenuIconProps,
  PopupMenuIconState,
} from './components/icon/icon.js'
export { PopupMenuIcon } from './components/icon/icon.js'

// ============================================================================
// Content Components
// ============================================================================

export type {
  PopupMenuEmptyProps,
  PopupMenuEmptyState,
} from './components/empty/empty.js'
export { PopupMenuEmpty } from './components/empty/empty.js'
export type {
  PopupMenuInputProps,
  PopupMenuInputState,
} from './components/input/input.js'
export { PopupMenuInput } from './components/input/input.js'
export type {
  PopupMenuListChildrenState,
  PopupMenuListProps,
  PopupMenuListState,
} from './components/list/list.js'
export { PopupMenuList } from './components/list/list.js'
export { PopupMenuScrollArrowDataAttributes } from './components/scroll-arrow/scroll-arrow.data-attrs.js'
export type {
  PopupMenuScrollArrowProps,
  PopupMenuScrollArrowState,
  PopupMenuScrollDownArrowProps,
  PopupMenuScrollUpArrowProps,
} from './components/scroll-arrow/scroll-arrow.js'
export {
  PopupMenuScrollArrow,
  PopupMenuScrollDownArrow,
  PopupMenuScrollUpArrow,
} from './components/scroll-arrow/scroll-arrow.js'
export type {
  PopupMenuSurfaceProps,
  PopupMenuSurfaceState,
} from './components/surface/surface.js'
export { PopupMenuSurface } from './components/surface/surface.js'

// ============================================================================
// Item Components
// ============================================================================

export type {
  PopupMenuCheckboxItemProps,
  PopupMenuCheckboxItemState,
} from './components/checkbox-item/checkbox-item.js'
export {
  PopupMenuCheckboxItem,
  PopupMenuCheckboxItemDataAttributes,
} from './components/checkbox-item/checkbox-item.js'
export type { CheckboxItemContextValue } from './components/checkbox-item/checkbox-item-context.js'
export {
  CheckboxItemContext,
  useCheckboxItemContext,
} from './components/checkbox-item/checkbox-item-context.js'
export type {
  PopupMenuCheckboxItemIndicatorProps,
  PopupMenuCheckboxItemIndicatorState,
} from './components/checkbox-item/checkbox-item-indicator.js'
export { PopupMenuCheckboxItemIndicator } from './components/checkbox-item/checkbox-item-indicator.js'
export type {
  PopupMenuItemProps,
  PopupMenuItemState,
} from './components/item/item.js'
export {
  PopupMenuItem,
  PopupMenuItemDataAttributes,
} from './components/item/item.js'
export type {
  PopupMenuRadioGroupProps,
  PopupMenuRadioGroupState,
} from './components/radio-group/radio-group.js'
export {
  PopupMenuRadioGroup,
  PopupMenuRadioGroupDataAttributes,
} from './components/radio-group/radio-group.js'
export type { RadioGroupContextValue } from './components/radio-group/radio-group-context.js'
export {
  RadioGroupContext,
  useRadioGroupContext,
} from './components/radio-group/radio-group-context.js'
export type {
  PopupMenuRadioItemProps,
  PopupMenuRadioItemState,
} from './components/radio-item/radio-item.js'
export {
  PopupMenuRadioItem,
  PopupMenuRadioItemDataAttributes,
} from './components/radio-item/radio-item.js'
export type { RadioItemContextValue } from './components/radio-item/radio-item-context.js'
export {
  RadioItemContext,
  useRadioItemContext,
} from './components/radio-item/radio-item-context.js'
export type {
  PopupMenuRadioItemIndicatorProps,
  PopupMenuRadioItemIndicatorState,
} from './components/radio-item/radio-item-indicator.js'
export { PopupMenuRadioItemIndicator } from './components/radio-item/radio-item-indicator.js'

// ============================================================================
// Structure Components
// ============================================================================

export type {
  PopupMenuGroupProps,
  PopupMenuGroupState,
} from './components/group/group.js'
export { PopupMenuGroup } from './components/group/group.js'
export type {
  PopupMenuGroupLabelProps,
  PopupMenuGroupLabelState,
} from './components/group-label/group-label.js'
export { PopupMenuGroupLabel } from './components/group-label/group-label.js'
export type {
  PopupMenuSeparatorProps,
  PopupMenuSeparatorState,
} from './components/separator/separator.js'
export { PopupMenuSeparator } from './components/separator/separator.js'
export type {
  PopupMenuShortcutProps,
  PopupMenuShortcutState,
} from './components/shortcut/shortcut.js'
export {
  PopupMenuShortcut,
  PopupMenuShortcutDataAttributes,
} from './components/shortcut/shortcut.js'

// ============================================================================
// Submenu Components
// ============================================================================

export type { PopupMenuSubmenuRootProps } from './components/submenu-root/submenu-root.js'
export { PopupMenuSubmenuRoot } from './components/submenu-root/submenu-root.js'
export type {
  PopupMenuSubmenuTriggerProps,
  PopupMenuSubmenuTriggerState,
} from './components/submenu-trigger/submenu-trigger.js'
export { PopupMenuSubmenuTrigger } from './components/submenu-trigger/submenu-trigger.js'
export type {
  PopupMenuSubmenuTriggerIndicatorProps,
  PopupMenuSubmenuTriggerIndicatorState,
} from './components/submenu-trigger/submenu-trigger-indicator.js'
export {
  PopupMenuSubmenuTriggerDataAttributes,
  PopupMenuSubmenuTriggerIndicator,
} from './components/submenu-trigger/submenu-trigger-indicator.js'
