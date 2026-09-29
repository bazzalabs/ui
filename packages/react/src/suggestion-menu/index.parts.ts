// ============================================================================
// Suggestion Menu Parts
// ============================================================================

// Pure aliases of the canonical resolved-node model (ADR-0001).
export type {
  NodeDef,
  PopupMenuNode as Node,
} from '../internal/popup-menu/index.js'

export {
  PopupMenuArrow as Arrow,
  PopupMenuEmpty as Empty,
  PopupMenuFooter as Footer,
  PopupMenuGroup as Group,
  PopupMenuGroupLabel as GroupLabel,
  PopupMenuGroupValue as GroupValue,
  PopupMenuHeader as Header,
  PopupMenuIcon as Icon,
  PopupMenuItem as Item,
  PopupMenuLinkItem as LinkItem,
  PopupMenuLoading as Loading,
  PopupMenuPortal as Portal,
  PopupMenuScrollDownArrow as ScrollDownArrow,
  PopupMenuScrollUpArrow as ScrollUpArrow,
  PopupMenuSeparator as Separator,
  PopupMenuTree as Tree,
  PopupMenuTreeConnector as TreeConnector,
  PopupMenuTreeItem as TreeItem,
  useAsyncMenuCoordinator,
  useDataList,
} from '../internal/popup-menu/index.js'
export {
  createSuggestionMenuHandle as createHandle,
  SuggestionMenuHandle as Handle,
} from './handle.js'
export { SuggestionMenuList as List } from './list/list.js'
export { SuggestionMenuPopup as Popup } from './popup/popup.js'
export { SuggestionMenuPositioner as Positioner } from './positioner/positioner.js'
export { SuggestionMenuRoot as Root } from './root/root.js'
export { SuggestionMenuSurface as Surface } from './surface/surface.js'
export { attachTextTrigger } from './text-trigger/attach-text-trigger.js'
export type {
  SuggestionMenuTextTrigger as TextTrigger,
  SuggestionMenuTextTriggerMatch as TextTriggerMatch,
} from './text-trigger/match.js'
export { useTextTrigger } from './text-trigger/use-text-trigger.js'
