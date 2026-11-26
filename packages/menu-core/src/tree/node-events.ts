import type { ChangeEventDetails } from '../events/create-event-details.js'
import type { REASONS } from '../events/reasons.js'

// The change details a node def's callbacks receive (`onCheckedChange`,
// `onValueChange`). packages/react's popup-menu events re-export them.

/**
 * Reasons why a checkbox item's checked state changed.
 */
export type CheckedChangeReason =
  | typeof REASONS.itemPress
  | typeof REASONS.itemKeyboardSelect
  | typeof REASONS.rangeSelection
  | typeof REASONS.dragSelection

/**
 * Event details for checkbox item checked state changes.
 */
export type CheckedChangeEventDetails = ChangeEventDetails<CheckedChangeReason>

/**
 * Reasons why a checkbox group's value changed.
 */
export type CheckboxValueChangeReason =
  | typeof REASONS.itemPress
  | typeof REASONS.itemKeyboardSelect
  | typeof REASONS.rangeSelection
  | typeof REASONS.dragSelection

/**
 * Event details for checkbox group value changes.
 */
export type CheckboxValueChangeEventDetails =
  ChangeEventDetails<CheckboxValueChangeReason>

/**
 * Reasons why a radio group's value changed.
 */
export type RadioValueChangeReason =
  | typeof REASONS.itemPress
  | typeof REASONS.itemKeyboardSelect

/**
 * Event details for radio group value changes.
 */
export type RadioValueChangeEventDetails =
  ChangeEventDetails<RadioValueChangeReason>
