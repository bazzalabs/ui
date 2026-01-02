export * as Menu from './index.parts.js'

// Individual named component exports (for composition in other packages)
export { MenuRoot } from './root/menu-root.js'
export { MenuSurface } from './surface/menu-surface.js'
export { MenuList } from './list/menu-list.js'
export { MenuItem } from './item/menu-item.js'
export { MenuInput } from './input/menu-input.js'
export { MenuCheckboxItem } from './checkbox-item/menu-checkbox-item.js'
export { MenuCheckboxItemIndicator } from './checkbox-item-indicator/menu-checkbox-item-indicator.js'
export { MenuGroup } from './group/menu-group.js'
export { MenuGroupHeading } from './group-heading/menu-group-heading.js'
export { MenuSeparator } from './separator/menu-separator.js'
export { MenuRadioGroup } from './radio-group/menu-radio-group.js'
export { MenuRadioGroupItem } from './radio-group-item/menu-radio-group-item.js'
export { MenuRadioGroupItemIndicator } from './radio-group-item-indicator/menu-radio-group-item-indicator.js'
export { MenuHeader } from './header/menu-header.js'
export { MenuFooter } from './footer/menu-footer.js'
export { MenuSubmenu } from './submenu/menu-submenu.js'
export { MenuSubmenuTrigger } from './submenu-trigger/menu-submenu-trigger.js'

// Type exports for each component
export type * from './root/menu-root.js'
export type * from './surface/menu-surface.js'
export type * from './list/menu-list.js'
export type * from './item/menu-item.js'
export type * from './input/menu-input.js'
export type * from './checkbox-item/menu-checkbox-item.js'
export type * from './checkbox-item-indicator/menu-checkbox-item-indicator.js'
export type * from './group/menu-group.js'
export type * from './group-heading/menu-group-heading.js'
export type * from './separator/menu-separator.js'
export type * from './radio-group/menu-radio-group.js'
export type * from './radio-group-item/menu-radio-group-item.js'
export type * from './radio-group-item-indicator/menu-radio-group-item-indicator.js'
export type * from './header/menu-header.js'
export type * from './footer/menu-footer.js'
export type * from './submenu/menu-submenu.js'
export type * from './submenu-trigger/menu-submenu-trigger.js'

// Context exports
export {
  useMenuRootContext,
  useOptionalMenuRootContext,
  type MenuRootContextValue,
} from './root/menu-root-context.js'
export {
  useMenuSurfaceContext,
  useOptionalMenuSurfaceContext,
  type MenuSurfaceContextValue,
} from './surface/menu-surface-context.js'
export {
  useMenuCheckboxItemContext,
  type MenuCheckboxItemContextValue,
} from './checkbox-item/menu-checkbox-item-context.js'
export {
  useMenuGroupContext,
  type MenuGroupContextValue,
} from './group/menu-group-context.js'
export {
  useMenuRadioGroupContext,
  type MenuRadioGroupContextValue,
} from './radio-group/menu-radio-group-context.js'
export {
  useMenuRadioGroupItemContext,
  type MenuRadioGroupItemContextValue,
} from './radio-group-item/menu-radio-group-item-context.js'
export {
  useMenuSubmenuContext,
  useOptionalMenuSubmenuContext,
  type MenuSubmenuContextValue,
} from './submenu/menu-submenu-context.js'

// Store exports
export {
  MenuStore,
  ROOT_SURFACE_ID,
  type MenuState,
  type MenuContext,
  type RowRecord,
  type SurfaceState,
  type Direction,
  type ActivationCause,
} from './store/index.js'

// Data attribute exports
export { MenuRootDataAttributes } from './root/menu-root.data-attributes.js'
export { MenuSurfaceDataAttributes } from './surface/menu-surface.data-attributes.js'
export { MenuListDataAttributes } from './list/menu-list.data-attributes.js'
export { MenuItemDataAttributes } from './item/menu-item.data-attributes.js'
export { MenuInputDataAttributes } from './input/menu-input.data-attributes.js'
export { MenuCheckboxItemDataAttributes } from './checkbox-item/menu-checkbox-item.data-attributes.js'
export { MenuCheckboxItemIndicatorDataAttributes } from './checkbox-item-indicator/menu-checkbox-item-indicator.data-attributes.js'
export { MenuGroupDataAttributes } from './group/menu-group.data-attributes.js'
export { MenuGroupHeadingDataAttributes } from './group-heading/menu-group-heading.data-attributes.js'
export { MenuSeparatorDataAttributes } from './separator/menu-separator.data-attributes.js'
export { MenuRadioGroupDataAttributes } from './radio-group/menu-radio-group.data-attributes.js'
export { MenuRadioGroupItemDataAttributes } from './radio-group-item/menu-radio-group-item.data-attributes.js'
export { MenuRadioGroupItemIndicatorDataAttributes } from './radio-group-item-indicator/menu-radio-group-item-indicator.data-attributes.js'
export { MenuHeaderDataAttributes } from './header/menu-header.data-attributes.js'
export { MenuFooterDataAttributes } from './footer/menu-footer.data-attributes.js'
export { MenuSubmenuDataAttributes } from './submenu/menu-submenu.data-attributes.js'
export { MenuSubmenuTriggerDataAttributes } from './submenu-trigger/menu-submenu-trigger.data-attributes.js'
