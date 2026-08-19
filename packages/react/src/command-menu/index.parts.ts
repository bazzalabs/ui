// ============================================================================
// Command Menu Parts
// ============================================================================

// Pure aliases of the canonical resolved-node model (ADR-0001): narrow the
// alias if a family ever needs to diverge — never edit the canonical type.
export type {
  NodeDef,
  PopupMenuNode as Node,
} from '../internal/popup-menu/index.js'

export {
  PopupMenuCheckboxItem as CheckboxItem,
  PopupMenuCheckboxItemIndicator as CheckboxItemIndicator,
  PopupMenuEmpty as Empty,
  PopupMenuFocusZone as FocusZone,
  PopupMenuFooter as Footer,
  PopupMenuGroup as Group,
  PopupMenuGroupLabel as GroupLabel,
  PopupMenuHeader as Header,
  PopupMenuIcon as Icon,
  PopupMenuItem as Item,
  PopupMenuList as List,
  PopupMenuLoading as Loading,
  PopupMenuSeparator as Separator,
  PopupMenuShortcut as Shortcut,
  PopupMenuSubpageBack as SubpageBack,
  PopupMenuSubpageBackItem as SubpageBackItem,
  PopupMenuSubpageTrigger as SubpageTrigger,
  PopupMenuSurface as Surface,
} from '../internal/popup-menu/index.js'
export { CommandMenuBackdrop as Backdrop } from './backdrop/backdrop.js'
export { CommandMenuInput as Input } from './input/input.js'
export { CommandMenuPopup as Popup } from './popup/popup.js'
export { CommandMenuPortal as Portal } from './portal/portal.js'
export { CommandMenuRoot as Root } from './root/root.js'
export { CommandMenuSubpage as Subpage } from './subpage/subpage.js'
export { CommandMenuTrigger as Trigger } from './trigger/trigger.js'
