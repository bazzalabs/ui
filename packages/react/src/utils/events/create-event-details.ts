import { REASONS } from './reasons.js'

// ============================================================================
// Reason to Native Event Type Mapping
// ============================================================================

/**
 * Maps event reason strings to their corresponding native DOM event types.
 * This provides type-safe access to the native event based on the reason.
 */
interface ReasonToEventMap {
  [REASONS.none]: Event

  // Trigger interactions
  [REASONS.triggerPress]: MouseEvent | PointerEvent | TouchEvent | KeyboardEvent
  [REASONS.triggerHover]: MouseEvent | PointerEvent
  [REASONS.triggerFocus]: FocusEvent
  [REASONS.triggerContextMenu]: MouseEvent

  // Dismissal reasons
  [REASONS.escapeKey]: KeyboardEvent
  [REASONS.outsidePress]: MouseEvent | PointerEvent | TouchEvent
  [REASONS.focusOut]: FocusEvent | KeyboardEvent

  // Item interactions
  [REASONS.itemPress]: MouseEvent | PointerEvent | KeyboardEvent
  [REASONS.itemKeyboardSelect]: KeyboardEvent
  [REASONS.closePress]: MouseEvent | PointerEvent | KeyboardEvent

  // Input interactions
  [REASONS.inputChange]: InputEvent | Event
  [REASONS.inputClear]: InputEvent | FocusEvent | Event
  [REASONS.clearPress]: MouseEvent | PointerEvent | KeyboardEvent

  // Navigation
  [REASONS.listNavigation]: KeyboardEvent

  // Submenu/menu management
  [REASONS.submenuTrigger]: MouseEvent | PointerEvent | KeyboardEvent
  [REASONS.siblingOpen]: Event

  // Highlight changes
  [REASONS.pointer]: MouseEvent | PointerEvent
  [REASONS.keyboard]: KeyboardEvent

  // Programmatic
  [REASONS.imperativeAction]: Event
}

/**
 * Maps a reason string to the corresponding native event type.
 * Falls back to `Event` for unknown reasons.
 */
export type ReasonToEvent<Reason extends string> =
  Reason extends keyof ReasonToEventMap ? ReasonToEventMap[Reason] : Event

// ============================================================================
// Change Event Details
// ============================================================================

/**
 * Details object passed to change event handlers (onOpenChange, onValueChange, etc.)
 *
 * @template Reason - The union of allowed reason strings for this event
 * @template CustomProperties - Additional component-specific properties
 */
export interface ChangeEventDetails<
  Reason extends string,
  _CustomProperties extends object = Record<string, never>,
> {
  /**
   * The reason why this state change occurred.
   * Use this to conditionally handle different scenarios.
   *
   * @example
   * ```tsx
   * onOpenChange={(open, details) => {
   *   if (details.reason === 'escape-key') {
   *     // Handle escape key differently
   *   }
   * }}
   * ```
   */
  reason: Reason

  /**
   * The native DOM event that triggered this change.
   * May be a synthetic event in some cases.
   */
  event: ReasonToEvent<Reason>

  /**
   * Cancels the state change.
   * When called, the component's internal state will not update.
   *
   * @example
   * ```tsx
   * onOpenChange={(open, details) => {
   *   if (!open && details.reason === 'outside-press') {
   *     details.cancel() // Prevent closing on outside press
   *   }
   * }}
   * ```
   */
  cancel: () => void

  /**
   * Allows the native event to propagate.
   * By default, some events (like Escape key) stop propagation
   * to prevent parent popups from closing simultaneously.
   */
  allowPropagation: () => void

  /**
   * Whether `cancel()` has been called.
   */
  readonly isCanceled: boolean

  /**
   * Whether `allowPropagation()` has been called.
   */
  readonly isPropagationAllowed: boolean

  /**
   * The element that triggered this event, if applicable.
   */
  trigger: Element | undefined
}

/**
 * Creates a change event details object.
 *
 * @param reason - The reason for the state change
 * @param event - The native DOM event (optional)
 * @param trigger - The element that triggered the event (optional)
 * @param customProperties - Additional component-specific properties (optional)
 */
export function createChangeEventDetails<
  Reason extends string,
  CustomProperties extends object = Record<string, never>,
>(
  reason: Reason,
  event?: ReasonToEvent<Reason> | Event,
  trigger?: Element,
  customProperties?: CustomProperties,
): ChangeEventDetails<Reason, CustomProperties> {
  let canceled = false
  let propagationAllowed = false

  const details: ChangeEventDetails<Reason, CustomProperties> = {
    reason,
    event: (event ?? new Event('ui-event')) as ReasonToEvent<Reason>,
    cancel() {
      canceled = true
    },
    allowPropagation() {
      propagationAllowed = true
    },
    get isCanceled() {
      return canceled
    },
    get isPropagationAllowed() {
      return propagationAllowed
    },
    trigger,
    ...(customProperties as CustomProperties),
  }

  return details
}

// ============================================================================
// Generic Event Details (for non-change events)
// ============================================================================

/**
 * Details object for generic events that don't support cancellation.
 * Used for events like onHighlightChange where cancellation doesn't make sense.
 *
 * @template Reason - The union of allowed reason strings for this event
 * @template CustomProperties - Additional component-specific properties
 */
export interface GenericEventDetails<
  Reason extends string,
  _CustomProperties extends object = Record<string, never>,
> {
  /**
   * The reason why this event occurred.
   */
  reason: Reason

  /**
   * The native DOM event that triggered this event.
   */
  event: ReasonToEvent<Reason>
}

/**
 * Creates a generic event details object (without cancel/propagation methods).
 */
export function createGenericEventDetails<
  Reason extends string,
  CustomProperties extends object = Record<string, never>,
>(
  reason: Reason,
  event?: ReasonToEvent<Reason> | Event,
  customProperties?: CustomProperties,
): GenericEventDetails<Reason, CustomProperties> {
  return {
    reason,
    event: (event ?? new Event('ui-event')) as ReasonToEvent<Reason>,
    ...(customProperties as CustomProperties),
  }
}
