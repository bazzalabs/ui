// Types
export type {
  PopupMenuPositionerProps,
  AnchorSide,
  Children,
  HoverPolicy,
  FocusOwnerCtxValue,
  PopupMenuSlots,
  PopupMenuSlotProps,
  PopupMenuClassNames,
  PopupMenuTheme,
  PopupMenuThemeDef,
  RowBindAPI,
  ContentBindAPI,
  ListBindAPI,
  GroupHeadingBindAPI,
  PositionerSlotProps,
} from './types.js'
export type { SubContextValue } from './contexts/submenu-context.js'
export type { ActivationCause } from './types.js'
export type { PointerDownOutsideEvent, FocusOutsideEvent } from './components/interaction-guard.js'

// Utilities
export { resolveAnchorSide, getSmoothedHeading, willHitSubmenu } from './lib/aim-guard.js'
export { defaultSlots } from './lib/slots.js'
export { OPEN_SUB_EVENT, CLOSE_MENU_EVENT, SELECT_ITEM_EVENT, dispatch, openSubmenuForActive } from './lib/events.js'

// Hooks
export { useMouseTrail } from './hooks/use-mouse-trail.js'
export { useMousePosition } from './hooks/use-mouse-position.js'

// Components
export { IntentZone } from './components/intent-zone.js'
export { InteractionGuard } from './components/interaction-guard.js'
export { PopupMenuContent } from './components/content.js'
export { PopupMenuList } from './components/list.js'
export { PopupMenuInput } from './components/input.js'
export { ListRenderer } from './components/list-renderer.js'
export { SurfaceProvider, useSurface } from './components/surface-provider.js'
export { Positioner } from './components/positioner.js'
export { PopupMenuSubmenu } from './components/submenu.js'
export { PopupMenuSubmenuTrigger } from './components/submenu-trigger.js'
export { PopupMenuSubmenuContent } from './components/submenu-content.js'

// Contexts
export { FocusOwnerCtx, useFocusOwner } from './contexts/focus-owner-context.js'
export { HoverPolicyCtx, useHoverPolicy, HoverPolicyProvider } from './contexts/hover-policy-context.js'
export { RootProvider, useRoot, type RootContextValue } from './contexts/root-context.js'
export { RootCloseProvider, useRootClose, type RootCloseContextValue } from './contexts/root-close-context.js'
export { SubCtx, useSubCtx, closeSubmenuChain } from './contexts/submenu-context.js'
export {
  GlobalThemeProvider,
  ScopedThemeProvider,
  useGlobalTheme,
  useScopedTheme,
  mergeTheme,
} from './contexts/theme-context.js'
