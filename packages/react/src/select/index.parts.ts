// ============================================================================
// Select Parts
// ============================================================================
// Re-exports shared components from internal/popup-menu with Select-specific
// Root, Trigger, Value, Item, ItemLabel, and ItemIndicator components.

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
  // Trigger components
  PopupMenuIcon as Icon,
  PopupMenuInput as Input,
  PopupMenuList as List,
  // Positioning & Container
  PopupMenuPortal as Portal,
  // Scroll indicators
  PopupMenuScrollDownArrow as ScrollDownArrow,
  PopupMenuScrollUpArrow as ScrollUpArrow,
  PopupMenuSeparator as Separator,
} from '../internal/popup-menu/index.js'
export { SelectItem as Item } from './item/item.js'
export { SelectItemIndicator as ItemIndicator } from './item-indicator/item-indicator.js'
export { SelectItemLabel as ItemLabel } from './item-label/item-label.js'
// Select-specific Popup with alignItemWithTriggerActive state
export type { SelectPopupProps, SelectPopupState } from './popup/popup.js'
export { SelectPopup as Popup } from './popup/popup.js'
// Custom Select Positioner with alignItemWithTrigger support
export { SelectPositioner as Positioner } from './positioner/positioner.js'
// Select-specific components
export { SelectRoot as Root } from './root/root.js'
// Select-specific Surface with alignItemWithTrigger auto-highlight support
export { SelectSurface as Surface } from './surface/surface.js'
export { SelectTrigger as Trigger } from './trigger/trigger.js'
export { SelectValue as Value } from './value/value.js'
