// ============================================================================
// Context Menu Exports
// ============================================================================

// Namespace export
export * as ContextMenu from './index.parts.js'

// ============================================================================
// Context-menu specific components
// ============================================================================

// Root
export type { ContextMenuRoot, ContextMenuRootProps } from './root/root.js'

// Trigger
export { ContextMenuTriggerDataAttributes } from './trigger/trigger.data-attrs.js'
export type {
  ContextMenuTrigger,
  ContextMenuTriggerProps,
  ContextMenuTriggerState,
} from './trigger/trigger.js'

// ============================================================================
// Re-exported from internal/popup-menu (with ContextMenu prefix)
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
  PopupMenuArrow as ContextMenuArrow,
  PopupMenuArrowProps as ContextMenuArrowProps,
  PopupMenuBackdrop as ContextMenuBackdrop,
  PopupMenuBackdropProps as ContextMenuBackdropProps,
  PopupMenuCheckboxItem as ContextMenuCheckboxItem,
  PopupMenuCheckboxItemIndicator as ContextMenuCheckboxItemIndicator,
  PopupMenuCheckboxItemIndicatorProps as ContextMenuCheckboxItemIndicatorProps,
  PopupMenuCheckboxItemIndicatorState as ContextMenuCheckboxItemIndicatorState,
  PopupMenuCheckboxItemProps as ContextMenuCheckboxItemProps,
  PopupMenuCheckboxItemState as ContextMenuCheckboxItemState,
  PopupMenuEmpty as ContextMenuEmpty,
  PopupMenuEmptyProps as ContextMenuEmptyProps,
  PopupMenuEmptyState as ContextMenuEmptyState,
  PopupMenuGroup as ContextMenuGroup,
  PopupMenuGroupLabel as ContextMenuGroupLabel,
  PopupMenuGroupLabelProps as ContextMenuGroupLabelProps,
  PopupMenuGroupLabelState as ContextMenuGroupLabelState,
  PopupMenuGroupProps as ContextMenuGroupProps,
  PopupMenuGroupState as ContextMenuGroupState,
  PopupMenuIcon as ContextMenuIcon,
  PopupMenuIconProps as ContextMenuIconProps,
  PopupMenuIconState as ContextMenuIconState,
  PopupMenuInput as ContextMenuInput,
  PopupMenuInputProps as ContextMenuInputProps,
  PopupMenuInputState as ContextMenuInputState,
  PopupMenuItem as ContextMenuItem,
  PopupMenuItemProps as ContextMenuItemProps,
  PopupMenuItemState as ContextMenuItemState,
  PopupMenuList as ContextMenuList,
  PopupMenuListChildrenState as ContextMenuListChildrenState,
  PopupMenuListProps as ContextMenuListProps,
  PopupMenuListState as ContextMenuListState,
  PopupMenuPopup as ContextMenuPopup,
  PopupMenuPopupProps as ContextMenuPopupProps,
  PopupMenuPortal as ContextMenuPortal,
  PopupMenuPortalProps as ContextMenuPortalProps,
  PopupMenuPositioner as ContextMenuPositioner,
  PopupMenuPositionerAlign as ContextMenuPositionerAlign,
  PopupMenuPositionerProps as ContextMenuPositionerProps,
  PopupMenuRadioGroup as ContextMenuRadioGroup,
  PopupMenuRadioGroupProps as ContextMenuRadioGroupProps,
  PopupMenuRadioGroupState as ContextMenuRadioGroupState,
  PopupMenuRadioItem as ContextMenuRadioItem,
  PopupMenuRadioItemIndicator as ContextMenuRadioItemIndicator,
  PopupMenuRadioItemIndicatorProps as ContextMenuRadioItemIndicatorProps,
  PopupMenuRadioItemIndicatorState as ContextMenuRadioItemIndicatorState,
  PopupMenuRadioItemProps as ContextMenuRadioItemProps,
  PopupMenuRadioItemState as ContextMenuRadioItemState,
  PopupMenuScrollArrowProps as ContextMenuScrollArrowProps,
  PopupMenuScrollArrowState as ContextMenuScrollArrowState,
  PopupMenuScrollDownArrowProps as ContextMenuScrollDownArrowProps,
  PopupMenuScrollUpArrowProps as ContextMenuScrollUpArrowProps,
  PopupMenuSeparator as ContextMenuSeparator,
  PopupMenuSeparatorProps as ContextMenuSeparatorProps,
  PopupMenuSeparatorState as ContextMenuSeparatorState,
  PopupMenuShortcut as ContextMenuShortcut,
  PopupMenuShortcutProps as ContextMenuShortcutProps,
  PopupMenuShortcutState as ContextMenuShortcutState,
  PopupMenuSubmenuRoot as ContextMenuSubmenuRoot,
  PopupMenuSubmenuRootProps as ContextMenuSubmenuRootProps,
  PopupMenuSubmenuTrigger as ContextMenuSubmenuTrigger,
  PopupMenuSubmenuTriggerIndicator as ContextMenuSubmenuTriggerIndicator,
  PopupMenuSubmenuTriggerIndicatorProps as ContextMenuSubmenuTriggerIndicatorProps,
  PopupMenuSubmenuTriggerIndicatorState as ContextMenuSubmenuTriggerIndicatorState,
  PopupMenuSubmenuTriggerProps as ContextMenuSubmenuTriggerProps,
  PopupMenuSubmenuTriggerState as ContextMenuSubmenuTriggerState,
  PopupMenuSurface as ContextMenuSurface,
  PopupMenuSurfaceProps as ContextMenuSurfaceProps,
  PopupMenuSurfaceState as ContextMenuSurfaceState,
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
  PopupMenuArrowDataAttributes as ContextMenuArrowDataAttributes,
  PopupMenuBackdropDataAttributes as ContextMenuBackdropDataAttributes,
  PopupMenuCheckboxItemDataAttributes as ContextMenuCheckboxItemDataAttributes,
  PopupMenuIconDataAttributes as ContextMenuIconDataAttributes,
  PopupMenuItemDataAttributes as ContextMenuItemDataAttributes,
  PopupMenuListCssVars as ContextMenuListCssVars,
  PopupMenuListDataAttributes as ContextMenuListDataAttributes,
  PopupMenuPopupDataAttributes as ContextMenuPopupDataAttributes,
  PopupMenuPositionerCssVars as ContextMenuPositionerCssVars,
  PopupMenuPositionerDataAttributes as ContextMenuPositionerDataAttributes,
  PopupMenuRadioGroupDataAttributes as ContextMenuRadioGroupDataAttributes,
  PopupMenuRadioItemDataAttributes as ContextMenuRadioItemDataAttributes,
  PopupMenuScrollArrowDataAttributes as ContextMenuScrollArrowDataAttributes,
  PopupMenuShortcutDataAttributes as ContextMenuShortcutDataAttributes,
  PopupMenuSubmenuTriggerDataAttributes as ContextMenuSubmenuTriggerDataAttributes,
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
export type {
  PopupMenuContextValue as RootContextValue,
  SubmenuContextValue,
} from '../internal/popup-menu/index.js'
export {
  useMaybePopupMenuContext as useMaybeRootContext,
  useMaybeSubmenuContext,
  usePopupMenuContext as useRootContext,
  useSubmenuContext,
} from '../internal/popup-menu/index.js'

// ============================================================================
// Store (for advanced usage)
// ============================================================================

export type {
  FilterFn as ContextMenuFilterFn,
  ItemRegistration as ContextMenuItemRegistration,
  ListboxContext as ContextMenuStoreContext,
  ListboxState as ContextMenuStoreState,
  VirtualItem as ContextMenuVirtualItem,
} from '../internal/listbox/index.js'
export { ListboxStore as ContextMenuStore } from '../internal/listbox/index.js'

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

// ============================================================================
// Deep Search (Data-First API)
// ============================================================================

export type {
  CheckboxItemDef,
  CheckboxItemRenderParams,
  CheckboxItemRenderProps,
  DataListChildrenState,
  DataListProps,
  DataSurfaceContextValue,
  DataSurfaceProps,
  DeepSearchConfig,
  DisplayGroupNode,
  DisplayNode,
  DisplayRadioGroupNode,
  DisplayRowNode,
  GroupBehavior,
  GroupDef,
  GroupRenderContext,
  GroupRenderParams,
  ItemDef,
  ItemRenderParams,
  ItemRenderProps,
  NodeDef,
  PopupMenuDataInputProps as ContextMenuDataInputProps,
  PopupMenuDataListProps as ContextMenuDataListProps,
  PopupMenuDataSurfaceProps as ContextMenuDataSurfaceProps,
  PopupMenuRadioGroupValueProps as ContextMenuRadioGroupValueProps,
  RadioGroupDef,
  RadioGroupRenderParams,
  RadioGroupRenderProps,
  RenderNodeFn,
  RowRenderContext,
  ScoredNode,
  SeparatorDef,
  SubmenuDef,
  SubmenuRenderParams,
  SubmenuRenderProps,
} from '../internal/popup-menu/index.js'

export {
  DataSurfaceContext,
  defineRadioGroup,
  isDisplayGroupNode,
  isDisplayRadioGroupNode,
  isDisplayRowNode,
  PopupMenuDataInput as ContextMenuDataInput,
  PopupMenuDataList as ContextMenuDataList,
  PopupMenuDataSurface as ContextMenuDataSurface,
  PopupMenuRadioGroupValue as ContextMenuRadioGroupValue,
  useDataSurfaceContext,
  useMaybeDataSurfaceContext,
} from '../internal/popup-menu/index.js'
