import type {
  ChangeEventDetails,
  GenericEventDetails,
  REASONS,
} from '../utils/events/index.js'

// ============================================================================
// Suggestion Menu Event Types
// ============================================================================

/**
 * Reasons why the suggestion menu's open state changed.
 * - `imperative-action`: the handle's `update()` or `close()`, or the host
 *   input was detached or replaced
 * - `item-press`: a row was chosen (click or Enter)
 * - `escape-key`: Escape was pressed in the host input
 * - `outside-press`: a press outside the popup and the host input
 * - `focus-out`: the host input lost focus
 * - `no-results`: with `noResults: 'close'`, the results settled empty
 */
export type SuggestionMenuOpenChangeReason =
  | typeof REASONS.imperativeAction
  | typeof REASONS.itemPress
  | typeof REASONS.escapeKey
  | typeof REASONS.outsidePress
  | typeof REASONS.focusOut
  | typeof REASONS.noResults
  | typeof REASONS.none

/**
 * Event details passed to the `onOpenChange` callback.
 */
export type SuggestionMenuOpenChangeEventDetails =
  ChangeEventDetails<SuggestionMenuOpenChangeReason>

/**
 * Reasons why the highlight changed.
 */
export type SuggestionMenuHighlightChangeReason =
  | typeof REASONS.pointer
  | typeof REASONS.keyboard
  | typeof REASONS.none

/**
 * Event details passed to the `onHighlightChange` callback.
 */
export type SuggestionMenuHighlightChangeEventDetails = GenericEventDetails<
  SuggestionMenuHighlightChangeReason,
  { index: number }
>
