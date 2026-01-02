export * as DropdownMenu from './index.parts.js'

// Custom component types
export type * from './root/dropdown-menu-root.js'
export type * from './trigger/dropdown-menu-trigger.js'
export type * from './portal/dropdown-menu-portal.js'
export type * from './backdrop/dropdown-menu-backdrop.js'
export type * from './positioner/dropdown-menu-positioner.js'
export type * from './surface/dropdown-menu-surface.js'
export type * from './arrow/dropdown-menu-arrow.js'
export type * from './submenu/dropdown-menu-submenu.js'
export type * from './submenu-trigger/dropdown-menu-submenu-trigger.js'

// Type aliases for re-exported menu-v2 components
export type {
  MenuListProps as DropdownMenuListProps,
  MenuListState as DropdownMenuListState,
} from '@bazza-ui/menu-v2'
export type {
  MenuItemProps as DropdownMenuItemProps,
  MenuItemState as DropdownMenuItemState,
} from '@bazza-ui/menu-v2'
export type {
  MenuInputProps as DropdownMenuInputProps,
  MenuInputState as DropdownMenuInputState,
} from '@bazza-ui/menu-v2'
export type {
  MenuCheckboxItemProps as DropdownMenuCheckboxItemProps,
  MenuCheckboxItemState as DropdownMenuCheckboxItemState,
} from '@bazza-ui/menu-v2'
export type {
  MenuCheckboxItemIndicatorProps as DropdownMenuCheckboxItemIndicatorProps,
  MenuCheckboxItemIndicatorState as DropdownMenuCheckboxItemIndicatorState,
} from '@bazza-ui/menu-v2'
export type {
  MenuRadioGroupProps as DropdownMenuRadioGroupProps,
  MenuRadioGroupState as DropdownMenuRadioGroupState,
} from '@bazza-ui/menu-v2'
export type {
  MenuRadioGroupItemProps as DropdownMenuRadioGroupItemProps,
  MenuRadioGroupItemState as DropdownMenuRadioGroupItemState,
} from '@bazza-ui/menu-v2'
export type {
  MenuRadioGroupItemIndicatorProps as DropdownMenuRadioGroupItemIndicatorProps,
  MenuRadioGroupItemIndicatorState as DropdownMenuRadioGroupItemIndicatorState,
} from '@bazza-ui/menu-v2'
export type {
  MenuGroupProps as DropdownMenuGroupProps,
  MenuGroupState as DropdownMenuGroupState,
} from '@bazza-ui/menu-v2'
export type {
  MenuGroupHeadingProps as DropdownMenuGroupHeadingProps,
  MenuGroupHeadingState as DropdownMenuGroupHeadingState,
} from '@bazza-ui/menu-v2'
export type {
  MenuHeaderProps as DropdownMenuHeaderProps,
  MenuHeaderState as DropdownMenuHeaderState,
} from '@bazza-ui/menu-v2'
export type {
  MenuFooterProps as DropdownMenuFooterProps,
  MenuFooterState as DropdownMenuFooterState,
} from '@bazza-ui/menu-v2'
export type {
  MenuSeparatorProps as DropdownMenuSeparatorProps,
  MenuSeparatorState as DropdownMenuSeparatorState,
} from '@bazza-ui/menu-v2'

// Context exports (for advanced use cases)
export {
  useDropdownMenuRootContext,
  useOptionalDropdownMenuRootContext,
  type DropdownMenuRootContextValue,
} from './root/dropdown-menu-root-context.js'

// Re-export MenuStore for external store usage
export { MenuStore } from '@bazza-ui/menu-v2'
