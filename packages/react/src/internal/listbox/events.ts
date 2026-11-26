import type {
  ChangeEventDetails,
  GenericEventDetails,
  REASONS,
} from '../../utils/events/index.js'

// ============================================================================
// Shared Listbox Event Types
// ============================================================================
// The store reports these. `internal/popup-menu/events.ts` re-exports them
// under the same names for the menus built on it.

/**
 * Reasons why a popup menu's open state changed.
 */
export type PopupMenuOpenChangeReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.triggerHover
  | typeof REASONS.triggerFocus
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
 * Event details for popup menu open state changes.
 */
export type PopupMenuOpenChangeEventDetails =
  ChangeEventDetails<PopupMenuOpenChangeReason>

/**
 * Reasons why highlight changed.
 */
export type HighlightChangeReason =
  | typeof REASONS.pointer
  | typeof REASONS.keyboard
  | typeof REASONS.auto
  | typeof REASONS.none

/**
 * Event details for highlight changes.
 */
export type HighlightChangeEventDetails = GenericEventDetails<
  HighlightChangeReason,
  { index: number }
>
