import type {
  ChangeEventDetails,
  GenericEventDetails,
  REASONS,
} from '../utils/events/index.js'

// ============================================================================
// Select Event Types
// ============================================================================

/**
 * Reasons why the select's open state changed.
 */
export type SelectOpenChangeReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.escapeKey
  | typeof REASONS.outsidePress
  | typeof REASONS.focusOut
  | typeof REASONS.itemPress
  | typeof REASONS.listNavigation
  | typeof REASONS.imperativeAction
  | typeof REASONS.none

/**
 * Event details passed to the `onOpenChange` callback.
 */
export type SelectOpenChangeEventDetails =
  ChangeEventDetails<SelectOpenChangeReason>

/**
 * Reasons why the selected value changed.
 */
export type SelectValueChangeReason =
  | typeof REASONS.itemPress
  | typeof REASONS.itemKeyboardSelect
  | typeof REASONS.imperativeAction
  | typeof REASONS.none

/**
 * Event details passed to the `onValueChange` callback.
 */
export type SelectValueChangeEventDetails =
  ChangeEventDetails<SelectValueChangeReason>

/**
 * Event details passed to the `onValuesChange` callback (multi-select).
 */
export type SelectValuesChangeEventDetails =
  ChangeEventDetails<SelectValueChangeReason>

/**
 * Reasons why highlight changed.
 */
export type SelectHighlightChangeReason =
  | typeof REASONS.pointer
  | typeof REASONS.keyboard
  | typeof REASONS.none

/**
 * Event details passed to the `onHighlightChange` callback.
 */
export type SelectHighlightChangeEventDetails = GenericEventDetails<
  SelectHighlightChangeReason,
  { index: number }
>

/**
 * Reasons why an item was selected.
 */
export type SelectItemSelectReason =
  | typeof REASONS.itemPress
  | typeof REASONS.itemKeyboardSelect

/**
 * Event details passed to the item's `onSelect` callback.
 */
export type SelectItemSelectEventDetails =
  ChangeEventDetails<SelectItemSelectReason>
