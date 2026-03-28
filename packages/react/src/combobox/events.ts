import type {
  ChangeEventDetails,
  GenericEventDetails,
  REASONS,
} from '../utils/events/index.js'

// ============================================================================
// Combobox Event Types
// ============================================================================

/**
 * Reasons why the combobox's open state changed.
 */
export type ComboboxOpenChangeReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.escapeKey
  | typeof REASONS.outsidePress
  | typeof REASONS.focusOut
  | typeof REASONS.itemPress
  | typeof REASONS.inputChange
  | typeof REASONS.inputClear
  | typeof REASONS.listNavigation
  | typeof REASONS.imperativeAction
  | typeof REASONS.none

/**
 * Event details passed to the `onOpenChange` callback.
 */
export type ComboboxOpenChangeEventDetails =
  ChangeEventDetails<ComboboxOpenChangeReason>

/**
 * Reasons why the selected value changed.
 */
export type ComboboxValueChangeReason =
  | typeof REASONS.itemPress
  | typeof REASONS.itemKeyboardSelect
  | typeof REASONS.inputClear
  | typeof REASONS.clearPress
  | typeof REASONS.imperativeAction
  | typeof REASONS.none

/**
 * Event details passed to the `onValueChange` callback.
 */
export type ComboboxValueChangeEventDetails =
  ChangeEventDetails<ComboboxValueChangeReason>

/**
 * Event details passed to the `onValuesChange` callback (multi-select).
 */
export type ComboboxValuesChangeEventDetails =
  ChangeEventDetails<ComboboxValueChangeReason>

/**
 * Reasons why the input value changed.
 */
export type ComboboxInputValueChangeReason =
  | typeof REASONS.inputChange
  | typeof REASONS.inputClear
  | typeof REASONS.clearPress
  | typeof REASONS.itemPress
  | typeof REASONS.imperativeAction
  | typeof REASONS.none

/**
 * Event details passed to the `onInputValueChange` callback.
 */
export type ComboboxInputValueChangeEventDetails =
  ChangeEventDetails<ComboboxInputValueChangeReason>

/**
 * Reasons why highlight changed.
 */
export type ComboboxHighlightChangeReason =
  | typeof REASONS.pointer
  | typeof REASONS.keyboard
  | typeof REASONS.none

/**
 * Event details passed to the `onHighlightChange` callback.
 */
export type ComboboxHighlightChangeEventDetails = GenericEventDetails<
  ComboboxHighlightChangeReason,
  { index: number }
>

/**
 * Reasons why an item was selected.
 */
export type ComboboxItemSelectReason =
  | typeof REASONS.itemPress
  | typeof REASONS.itemKeyboardSelect

/**
 * Event details passed to the item's `onSelect` callback.
 */
export type ComboboxItemSelectEventDetails =
  ChangeEventDetails<ComboboxItemSelectReason>
