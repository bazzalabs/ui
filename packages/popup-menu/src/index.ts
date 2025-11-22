/** biome-ignore-all assist/source/organizeImports: manual sort */
// Types

export type {
  FocusOutsideEvent,
  InteractionGuardProps,
  PointerDownOutsideEvent,
} from './features/interaction/index.js'
export type { SubContextValue } from './components/submenu/index.js'
export type {
  ActivationCause,
  AnchorSide,
  Children,
  ContentBindAPI,
  FocusOwnerCtxValue,
  GroupHeadingBindAPI,
  HoverPolicy,
  ListBindAPI,
  PopupMenuPositionerProps,
  PopupMenuSlots,
  PopupMenuClassNames,
  PopupMenuSlotProps,
  PopupMenuTheme,
  PopupMenuThemeDef,
  PositionerSlotProps,
  RowBindAPI,
  PopupMenuDef,
  PopupSubmenuDef,
  PopupNodeDef,
  PopupSubmenuNode,
} from './types.js'

import type { InteractionGuardProps as _InteractionGuardProps } from './features/interaction/index.js'

/**
 * Subset of InteractionGuard props that can be customized by consumers.
 * Excludes internal props like scopeId, asChild, and children.
 */
export type InteractionGuardOptions = Pick<
  _InteractionGuardProps,
  | 'scopeAttr'
  | 'disableOutsidePointerEvents'
  | 'onEscapeKeyDown'
  | 'onPointerDownOutside'
  | 'onFocusOutside'
  | 'onInteractOutside'
  | 'onDismiss'
  | 'surfaceSelector'
  | 'branchAttr'
>

// Components
export {
  Surface as PopupMenuContent,
  Surface,
} from './components/surface/index.js'
export { Popup } from './components/popup/index.js'
export { PopupMenuInput } from './components/input/index.js'
export { IntentZone } from './components/intent-zone/index.js'
export { InteractionGuard } from './features/interaction/index.js'
export {
  List as PopupMenuList,
  List,
  PopupMenuItem,
} from './components/list/index.js'
export { Positioner } from './components/positioner/index.js'
export {
  PopupMenuSubmenu,
  PopupMenuSubmenuContent,
  PopupMenuSubmenuTrigger,
} from './components/submenu/index.js'
export { SurfaceProvider, useSurface } from './components/surface/index.js'

// Contexts
export { FocusOwnerCtx, useFocusOwner } from './contexts/focus-owner-context.js'
export {
  HoverPolicyCtx,
  HoverPolicyProvider,
  useHoverPolicy,
} from './features/hover-policy/index.js'
export {
  type RootContextValue,
  RootProvider,
  useRoot,
} from './contexts/root-context.js'
export {
  closeSubmenuChain,
  SubCtx,
  useSub as useSubCtx,
} from './components/submenu/index.js'
export {
  GlobalThemeProvider,
  mergeTheme,
  ScopedThemeProvider,
  useGlobalTheme,
  useScopedTheme,
} from './contexts/theme-context.js'

// Hooks
export {
  useMousePosition,
  useMouseTrail,
} from './features/hover-policy/index.js'

// Utilities
export {
  getSmoothedHeading,
  resolveAnchorSide,
  willHitSubmenu,
} from './features/hover-policy/index.js'
export {
  CLOSE_MENU_EVENT,
  dispatch,
  OPEN_SUB_EVENT,
  openSubmenuForActive,
  SELECT_ITEM_EVENT,
} from './features/interaction/index.js'
export { defaultSlots } from './components/slots/index.js'
