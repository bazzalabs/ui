/** biome-ignore-all assist/source/organizeImports: manual sort */
// Types

export type {
  FocusOutsideEvent,
  InteractionGuardProps,
  PointerDownOutsideEvent,
} from './components/interaction-guard.js'
export type { SubContextValue } from './contexts/submenu-context.js'
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

import type { InteractionGuardProps as _InteractionGuardProps } from './components/interaction-guard.js'

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

export { PopupMenuContent } from './components/content.js'
export { PopupMenuInput } from './components/input.js'
// Components
export { IntentZone } from './components/intent-zone.js'
export { InteractionGuard } from './components/interaction-guard.js'
export { PopupMenuList } from './components/list.js'
export { ListRenderer } from './components/list-renderer.js'
export { Positioner } from './components/positioner.js'
export { PopupMenuSubmenu } from './components/submenu.js'
export { PopupMenuSubmenuContent } from './components/submenu-content.js'
export { PopupMenuSubmenuTrigger } from './components/submenu-trigger.js'
export { SurfaceProvider, useSurface } from './components/surface-provider.js'
// Contexts
export { FocusOwnerCtx, useFocusOwner } from './contexts/focus-owner-context.js'
export {
  HoverPolicyCtx,
  HoverPolicyProvider,
  useHoverPolicy,
} from './contexts/hover-policy-context.js'
export {
  type RootContextValue,
  RootProvider,
  useRoot,
} from './contexts/root-context.js'
export {
  closeSubmenuChain,
  SubCtx,
  useSub as useSubCtx,
} from './contexts/submenu-context.js'
export {
  GlobalThemeProvider,
  mergeTheme,
  ScopedThemeProvider,
  useGlobalTheme,
  useScopedTheme,
} from './contexts/theme-context.js'
export { useMousePosition } from './hooks/use-mouse-position.js'
// Hooks
export { useMouseTrail } from './hooks/use-mouse-trail.js'
// Utilities
export {
  getSmoothedHeading,
  resolveAnchorSide,
  willHitSubmenu,
} from './lib/aim-guard.js'
export {
  CLOSE_MENU_EVENT,
  dispatch,
  OPEN_SUB_EVENT,
  openSubmenuForActive,
  SELECT_ITEM_EVENT,
} from './lib/events.js'
export { defaultSlots } from './lib/slots.js'
