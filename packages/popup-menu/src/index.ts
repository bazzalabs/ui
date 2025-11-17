// Types
export type { PopupMenuPositionerProps, AnchorSide, Children, HoverPolicy, FocusOwnerCtxValue } from './types.js'
export type { PointerDownOutsideEvent, FocusOutsideEvent } from './components/interaction-guard.js'

// Utilities
export { resolveAnchorSide, getSmoothedHeading, willHitSubmenu } from './lib/aim-guard.js'

// Hooks
export { useMouseTrail } from './hooks/use-mouse-trail.js'
export { useMousePosition } from './hooks/use-mouse-position.js'

// Components
export { IntentZone } from './components/intent-zone.js'
export { InteractionGuard } from './components/interaction-guard.js'

// Contexts
export { FocusOwnerCtx, useFocusOwner } from './contexts/focus-owner-context.js'
export { HoverPolicyCtx, useHoverPolicy } from './contexts/hover-policy-context.js'
