// ============================================================================
// Combobox Parts
// ============================================================================
// Re-exports shared components from internal/popup-menu with Combobox-specific
// Root, Input, Item, ItemLabel, and ItemIndicator components.

// Re-export VirtualItem type from internal/listbox
export type { VirtualItem } from '../internal/listbox/index.js'

// Re-export shared components from internal/popup-menu
export {
  PopupMenuArrow as Arrow,
  PopupMenuBackdrop as Backdrop,
  PopupMenuEmpty as Empty,
  // Structure
  PopupMenuGroup as Group,
  PopupMenuGroupLabel as GroupLabel,
  // Icon
  PopupMenuIcon as Icon,
  PopupMenuList as List,
  PopupMenuPopup as Popup,
  // Positioning & Container
  PopupMenuPortal as Portal,
  // Scroll indicators
  PopupMenuScrollDownArrow as ScrollDownArrow,
  PopupMenuScrollUpArrow as ScrollUpArrow,
  PopupMenuSeparator as Separator,
} from '../internal/popup-menu/index.js'
export { ComboboxClear as Clear } from './clear/clear.js'
export { ComboboxInput as Input } from './input/input.js'
export { ComboboxItem as Item } from './item/item.js'
export { ComboboxItemIndicator as ItemIndicator } from './item-indicator/item-indicator.js'
export { ComboboxItemLabel as ItemLabel } from './item-label/item-label.js'
export { ComboboxPositioner as Positioner } from './positioner/positioner.js'
// Combobox-specific components
export { ComboboxRoot as Root } from './root/root.js'
export { ComboboxSurface as Surface } from './surface/surface.js'
