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

// The change details node def callbacks receive live with the node def schema.
export type {
  CheckboxValueChangeEventDetails,
  CheckboxValueChangeReason,
  CheckedChangeEventDetails,
  CheckedChangeReason,
  RadioValueChangeEventDetails,
  RadioValueChangeReason,
} from '@bazza-ui/menu-core'

/**
 * Reasons a range selection or drag selection commit reports.
 */
export type SelectionCommitReason =
  | typeof REASONS.rangeSelection
  | typeof REASONS.dragSelection
