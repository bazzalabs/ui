import type { ChangeEventDetails, REASONS } from '../utils/events/index.js'

// ============================================================================
// Command Menu Event Types
// ============================================================================

/**
 * Reasons why the command menu's open state changed.
 * - `trigger-press`: `CommandMenu.Trigger` was pressed
 * - `imperative-action`: the `hotkey` was pressed
 * - `escape-key`: Escape was pressed
 * - `outside-press`: a press outside the popup
 * - `focus-out`: focus left the menu
 * - `item-press`: a row was chosen (click or Enter)
 * - `close-press`: a close button was pressed
 */
export type CommandMenuOpenChangeReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.imperativeAction
  | typeof REASONS.escapeKey
  | typeof REASONS.outsidePress
  | typeof REASONS.focusOut
  | typeof REASONS.itemPress
  | typeof REASONS.closePress
  | typeof REASONS.none

/**
 * Event details passed to the `onOpenChange` callback.
 */
export type CommandMenuOpenChangeEventDetails =
  ChangeEventDetails<CommandMenuOpenChangeReason>
