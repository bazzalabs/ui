import { REASONS } from '../events/reasons.js'

/** Where in a menu tree an open change is asked for. */
export type OpenChangeLevel = 'root' | 'submenu' | 'subpage'

/**
 * An open change some part of a menu asks for, with what the caller knows
 * about the event behind it. The policy reads nothing else.
 */
export interface OpenChangeRequest<R extends string = string, E = unknown> {
  readonly open: boolean
  readonly reason: R
  readonly event?: E
  readonly level: OpenChangeLevel
  /**
   * The menu ignores user interaction: a disabled root cancels every open,
   * and the dismissals Base UI reports for it (its own Escape, outside press
   * and focus-out); a disabled submenu refuses to open (it still closes with
   * its menu). An `imperative-action`, and a close the engine makes
   * (`engine`), pass.
   */
  readonly disabled?: boolean
  /**
   * The engine closes the menu, not Base UI's dismissal: `closeAll` (a row
   * chosen, Escape or Tab handled by the menu's own keys, a trigger press,
   * the root's own outside-press listener), a Combobox closing itself (its
   * input's blur, Escape, a choice), Select's resize close. A disabled menu
   * still closes, as it did before the close policy.
   */
  readonly engine?: boolean
  /**
   * Escape closes the whole tree from a submenu or subpage, instead of only
   * the submenu, or going back a page. Defaults to true in a submenu, false
   * in a subpage, as their props do.
   */
  readonly closeRootOnEsc?: boolean
  /**
   * The element pressed (an outside press), or gaining focus (a focus-out),
   * is one the menu exempts from dismissal.
   */
  readonly exempt?: boolean
  /** The element gaining focus (a focus-out) is inside one of the tree's popups. */
  readonly focusInTree?: boolean
  /**
   * The element pressed (an outside press), or gaining focus (a focus-out),
   * is outside every popup of the tree (outside its elements, or on its
   * backdrop). A submenu leaves such a dismissal to its root when the root
   * hears it too: an outside press, or a focus-out an outside press caused
   * (`outsidePress`). The root's close closes the submenu.
   */
  readonly outsideTree?: boolean
  /**
   * An outside press that came just before this change: a focus-out it
   * caused is reported as that press (at the root), or left to the root
   * (in a submenu).
   */
  readonly outsidePress?: E
}

/**
 * What to do with an open change:
 * - `allow`: make it, reported with `reason` and `event` (the request's, or
 *   the outside press a focus-out came from);
 * - `cancel`: don't make it;
 * - `redirect`: close the whole tree from the root instead, with `reason`;
 * - `back`: go back one subpage instead.
 */
export type OpenChangeDecision<R extends string = string, E = unknown> =
  | { readonly type: 'allow'; readonly reason: R; readonly event?: E }
  | { readonly type: 'cancel' }
  | {
      readonly type: 'redirect'
      readonly to: 'root'
      readonly reason: R
      readonly event?: E
    }
  | { readonly type: 'back' }

const CANCEL = { type: 'cancel' } as const
const BACK = { type: 'back' } as const

/**
 * The close policy: what every root, submenu and subpage of a menu tree does
 * with an open change asked of it. Pure; the caller works out the facts
 * (`exempt`, `focusInTree`, …) from the event and applies the decision.
 */
export function decideOpenChange<R extends string, E>(
  request: OpenChangeRequest<R, E>,
): OpenChangeDecision<R | typeof REASONS.outsidePress, E> {
  const { open, reason, event, level } = request

  if (
    request.disabled &&
    reason !== REASONS.imperativeAction &&
    (open || (level === 'root' && !request.engine))
  ) {
    return CANCEL
  }

  if (open) return { type: 'allow', reason, event }

  // A submenu leaves a dismissal from outside the tree to its root, when
  // the root hears it too. Any other focus-out closes the submenu itself.
  if (
    level === 'submenu' &&
    request.outsideTree &&
    (reason === REASONS.outsidePress ||
      (reason === REASONS.focusOut && request.outsidePress !== undefined))
  ) {
    return CANCEL
  }

  // Pressing an exempt element, or focus moving to one, or to another popup
  // of the tree, doesn't dismiss.
  if (reason === REASONS.outsidePress && request.exempt) return CANCEL
  if (reason === REASONS.focusOut && (request.exempt || request.focusInTree)) {
    return CANCEL
  }

  // A focus-out an outside press caused is that press.
  if (reason === REASONS.focusOut && request.outsidePress !== undefined) {
    return {
      type: 'allow',
      reason: REASONS.outsidePress,
      event: request.outsidePress,
    }
  }

  if (reason === REASONS.escapeKey) {
    if (level === 'subpage') {
      return request.closeRootOnEsc
        ? { type: 'redirect', to: 'root', reason, event }
        : BACK
    }
    if (level === 'submenu' && request.closeRootOnEsc !== false) {
      return { type: 'redirect', to: 'root', reason, event }
    }
  }

  return { type: 'allow', reason, event }
}
