import type {
  ChangeEventDetails,
  GenericEventDetails,
  REASONS,
} from '../utils/events/index.js'

// ============================================================================
// Dropdown Menu Event Types
// ============================================================================

/**
 * Reasons why the dropdown menu's open state changed.
 */
export type DropdownMenuOpenChangeReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.triggerHover
  | typeof REASONS.triggerFocus
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
export type DropdownMenuOpenChangeEventDetails =
  ChangeEventDetails<DropdownMenuOpenChangeReason>

/**
 * Reasons why highlight changed.
 */
export type DropdownMenuHighlightChangeReason =
  | typeof REASONS.pointer
  | typeof REASONS.keyboard
  | typeof REASONS.none

/**
 * Event details passed to the `onHighlightChange` callback.
 */
export type DropdownMenuHighlightChangeEventDetails = GenericEventDetails<
  DropdownMenuHighlightChangeReason,
  { index: number }
>
