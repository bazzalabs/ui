import type { ChangeEventDetails, REASONS } from '../../utils/events/index.js'
import type { HighlightChangeEventDetails } from '../listbox/events.js'
import type { PopupMenuNode } from './menu-tree/types.js'

export type {
  HighlightChangeEventDetails,
  HighlightChangeReason,
  PopupMenuOpenChangeEventDetails,
  PopupMenuOpenChangeReason,
} from '../listbox/events.js'

// ============================================================================
// Shared Popup Menu Event Types
// ============================================================================
// These types are shared across DropdownMenu, ContextMenu, and Select components.

export type PopupMenuHighlightChangeHandler<
  EventDetails = HighlightChangeEventDetails,
> = (
  id: string | null,
  node: PopupMenuNode | null,
  index: number,
  eventDetails: EventDetails,
) => void

/**
 * Reasons why an item was selected.
 */
export type ItemSelectReason =
  | typeof REASONS.itemPress
  | typeof REASONS.itemKeyboardSelect

/**
 * Event details for item selection.
 */
export type ItemSelectEventDetails = ChangeEventDetails<ItemSelectReason>

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
 * Reasons a range selection or drag selection commit reports.
 */
export type SelectionCommitReason =
  | typeof REASONS.rangeSelection
  | typeof REASONS.dragSelection

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
