import type {
  ChangeEventDetails,
  GenericEventDetails,
  REASONS,
} from '../../utils/events/index.js'
import type { PopupMenuNode } from './menu-tree/types.js'

// ============================================================================
// Shared Popup Menu Event Types
// ============================================================================
// These types are shared across DropdownMenu, ContextMenu, and Select components.

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

/**
 * Event details for checkbox item checked state changes.
 */
export type CheckedChangeEventDetails = ChangeEventDetails<CheckedChangeReason>

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
