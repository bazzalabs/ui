// ============================================================================
// Dropdown Menu Parts
// ============================================================================
// Re-exports shared components from internal/popup-menu with dropdown-menu specific
// Root and Trigger components.

// Re-export VirtualItem type from internal/listbox
export type { VirtualItem } from '../internal/listbox/index.js'
// Re-export shared components from internal/popup-menu
export {
  PopupMenuArrow as Arrow,
  PopupMenuBackdrop as Backdrop,
  PopupMenuCheckboxItem as CheckboxItem,
  PopupMenuCheckboxItemIndicator as CheckboxItemIndicator,
  PopupMenuDataInput as DataInput,
  PopupMenuDataList as DataList,
  // Deep Search (Data-First API)
  PopupMenuDataSurface as DataSurface,
  PopupMenuEmpty as Empty,
  // Structure
  PopupMenuGroup as Group,
  PopupMenuGroupLabel as GroupLabel,
  // Trigger components
  PopupMenuIcon as Icon,
  PopupMenuInput as Input,
  // Items
  PopupMenuItem as Item,
  PopupMenuList as List,
  PopupMenuLoading as Loading,
  PopupMenuPopup as Popup,
  // Positioning & Container
  PopupMenuPortal as Portal,
  PopupMenuPositioner as Positioner,
  PopupMenuRadioGroup as RadioGroup,
  PopupMenuRadioGroupValue as RadioGroupValue,
  PopupMenuRadioItem as RadioItem,
  PopupMenuRadioItemIndicator as RadioItemIndicator,
  // Scroll indicators
  PopupMenuScrollDownArrow as ScrollDownArrow,
  PopupMenuScrollUpArrow as ScrollUpArrow,
  PopupMenuSeparator as Separator,
  // Utility
  PopupMenuShortcut as Shortcut,
  // Submenus
  PopupMenuSubmenuRoot as Submenu,
  PopupMenuSubmenuTrigger as SubmenuTrigger,
  PopupMenuSubmenuTriggerIndicator as SubmenuTriggerIndicator,
  // Content
  PopupMenuSurface as Surface,
  // Async coordinator hooks
  useAsyncMenuCoordinator,
  useMaybeAsyncMenuCoordinator,
} from '../internal/popup-menu/index.js'
// Dropdown-menu specific components
export { DropdownMenuRoot as Root } from './root/root.js'
export { DropdownMenuTrigger as Trigger } from './trigger/trigger.js'
