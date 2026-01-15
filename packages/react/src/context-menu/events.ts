import type {
  ChangeEventDetails,
  GenericEventDetails,
  REASONS,
} from '../utils/events/index.js'

// ============================================================================
// Context Menu Event Types
// ============================================================================

/**
 * Reasons why the context menu's open state changed.
 */
export type ContextMenuOpenChangeReason =
  | typeof REASONS.triggerContextMenu
  | typeof REASONS.escapeKey
  | typeof REASONS.outsidePress
  | typeof REASONS.focusOut
  | typeof REASONS.itemPress
  | typeof REASONS.closePress
  | typeof REASONS.listNavigation
  | typeof REASONS.submenuTrigger
  | typeof REASONS.siblingOpen
  | typeof REASONS.imperativeAction
  | typeof REASONS.none

/**
 * Event details passed to the `onOpenChange` callback.
 */
export type ContextMenuOpenChangeEventDetails =
  ChangeEventDetails<ContextMenuOpenChangeReason>

/**
 * Reasons why highlight changed.
 */
export type ContextMenuHighlightChangeReason =
  | typeof REASONS.pointer
  | typeof REASONS.keyboard
  | typeof REASONS.none

/**
 * Event details passed to the `onHighlightChange` callback.
 */
export type ContextMenuHighlightChangeEventDetails = GenericEventDetails<
  ContextMenuHighlightChangeReason,
  { index: number }
>
