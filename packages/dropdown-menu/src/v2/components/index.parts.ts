/**
 * Named component exports for the Menu namespace pattern.
 * These are used to build the `Menu.*` API.
 *
 * @example
 * ```tsx
 * import { Menu } from '@bazza-ui/dropdown-menu/v2'
 *
 * // Components
 * <Menu.Root>
 *   <Menu.Trigger>Open</Menu.Trigger>
 *   <Menu.Portal>
 *     <Menu.Positioner>
 *       <Menu.Surface>
 *         <Menu.Item>Item 1</Menu.Item>
 *       </Menu.Surface>
 *     </Menu.Positioner>
 *   </Menu.Portal>
 * </Menu.Root>
 *
 * // Types
 * type Props = Menu.Trigger.Props
 * type State = Menu.Item.State
 * ```
 */

// Component exports - namespaces are preserved because tsc outputs per-file
// declarations and TypeScript resolves re-exports to the original files
export { MenuRoot as Root } from './root.js'
export { MenuTrigger as Trigger } from './trigger.js'
export { MenuPortal as Portal } from './portal.js'
export { MenuPositioner as Positioner } from './positioner.js'
export { MenuSurface as Surface } from './surface.js'
export { MenuItem as Item } from './item.js'
export { MenuGroup as Group } from './group.js'
export { MenuLabel as Label } from './label.js'
export { MenuSeparator as Separator } from './separator.js'
export { MenuSubmenu as Submenu } from './submenu.js'
export { MenuCheckboxItem as CheckboxItem } from './checkbox-item.js'
export {
  MenuRadioGroup as RadioGroup,
  MenuRadioItem as RadioItem,
} from './radio-group.js'
export { MenuInput as Input } from './input.js'
export { MenuList as List } from './list.js'
