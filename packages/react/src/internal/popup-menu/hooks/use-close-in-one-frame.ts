'use client'

import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect'
import { type ElementRegistry, REASONS } from '@bazza-ui/menu-core'
import * as React from 'react'
import { flushSync } from 'react-dom'
import {
  type CloseCause,
  getCloseCause,
  type ListboxStore,
  popupActionsOf,
} from '../../listbox/store/ListboxStore.js'
import { useMenuTree } from '../contexts/menu-tree-context.js'
import { getElementRegistry } from '../store/MenuTreeStore.js'

/** The events a press closes a popup on, before its `mousedown` moves focus. */
const PRESS_EVENTS = new Set(['pointerdown', 'mousedown', 'touchstart'])

/**
 * Whether a press closed the popup: on `pointerdown` (an outside press, a
 * backdrop, a consumer's own handler), the press's `mousedown` still has to
 * move focus, in the same task, after the close, and the popup's focus
 * manager returns focus as it unmounts, which has to come after that. Read
 * from the close's cause, or the event being dispatched as `open` goes false
 * (a consumer's handler that closes it records none).
 */
function closedByPress(cause: CloseCause | null): boolean {
  const dispatching = (globalThis as { event?: Event }).event
  return (
    PRESS_EVENTS.has(cause?.event?.type ?? '') ||
    cause?.reason === REASONS.outsidePress ||
    PRESS_EVENTS.has(dispatching?.type ?? '')
  )
}

/** A popup's close to complete before the browser paints (`drain`). */
interface Completion {
  popup: Element
  /** The registry of the popup's menu tree: a batch completes one tree. */
  registry: ElementRegistry
  /** The popup's menu depth: deeper ones complete first. */
  depth: number
  /** When it was queued: of two at one depth, the later completes first. */
  order: number
  complete: () => void
}

let pending: Completion[] | null = null

/**
 * Whether completing `batch` now reports every close in its document: it's
 * one menu tree's popups, and no other element is closing
 * (`[data-ending-style]`, Base UI's marker, ours or not) but them and the
 * tree's backdrops. A popup completing early unmounts what it holds, and a
 * popup held by one that closes reports its close only if it completes
 * first, which is known only within a tree (by depth). Anything else
 * closing with it (another tree, a Base UI popover), and the batch is Base
 * UI's, which completes inner popups first.
 */
function completesEveryClose(batch: Completion[]): boolean {
  const [first] = batch
  if (!first) return false
  const popups = new Set<Element>()
  for (const completion of batch) {
    if (completion.registry !== first.registry) return false
    popups.add(completion.popup)
  }
  for (const element of first.popup.ownerDocument.querySelectorAll(
    '[data-ending-style]',
  )) {
    if (!popups.has(element) && !first.registry.inBackdrop(element)) {
      return false
    }
  }
  return true
}

/** Reports an error a completion threw, as an uncaught one, after the rest. */
function reportLater(error: unknown) {
  if (typeof globalThis.reportError === 'function') {
    globalThis.reportError(error)
  } else {
    queueMicrotask(() => {
      throw error
    })
  }
}

/**
 * Completes every close queued this microtask checkpoint, the deepest
 * popups first, when they're all the closes there are
 * (`completesEveryClose`): a root's unmount unmounts its submenus, which
 * then never report their own close, so a submenu closing with its root
 * completes before it. Each completion checks again that its close is
 * still pending; one that throws doesn't keep the rest from completing.
 */
function drain() {
  const batch = pending ?? []
  pending = null
  if (!completesEveryClose(batch)) return
  batch.sort((a, b) => b.depth - a.depth || b.order - a.order)
  const errors: unknown[] = []
  for (const completion of batch) {
    try {
      completion.complete()
    } catch (error) {
      errors.push(error)
    }
  }
  for (const error of errors) reportLater(error)
}

function enqueue(completion: Omit<Completion, 'order'>) {
  if (!pending) {
    pending = []
    queueMicrotask(drain)
  }
  pending.push({ ...completion, order: pending.length })
}

/**
 * Whether Base UI completes a close at once itself, in its own effect: with
 * no `getAnimations()` (jsdom), or with its animations turned off.
 */
function completesAtOnce(popup: Element): boolean {
  return (
    typeof popup.getAnimations !== 'function' ||
    (globalThis as { BASE_UI_ANIMATIONS_DISABLED?: boolean })
      .BASE_UI_ANIMATIONS_DISABLED === true
  )
}

/**
 * Whether the popup plays an exit animation: one of its own animations (as
 * Base UI waits on: the element's, not its subtree's) is still running.
 * `getAnimations()` brings styles up to date first, so the transition or
 * animation `[data-ending-style]` starts in the close's commit is listed.
 */
function playsExit(popup: Element): boolean {
  return popup
    .getAnimations()
    .some((animation) => animation.playState !== 'finished')
}

/**
 * Completes a popup's close before the browser paints when nothing animates
 * (design §6.2): it asks the popup's Base UI root to unmount it
 * (`popupActionsOf(store)`), which reports `onOpenChangeComplete(false)`.
 * Base UI would wait a frame first, painting the closed popup once. With an
 * exit animation, Base UI keeps the popup until it finishes, as before.
 * Returns a ref callback for the popup element, which it follows as it
 * changes (a `render` element swapped while the popup is mounted).
 *
 * - It acts when Base UI's close starts: as `[data-ending-style]` lands on
 *   the popup, which Base UI adds in a commit synced from its root's layout
 *   effect. A `MutationObserver` hears it in a microtask after React's
 *   commits, without rendering the popup part, and queues the completion.
 * - Every completion queued in that checkpoint runs in one microtask, before
 *   the browser paints, the deepest popup first (`depth`): a root closing
 *   with its submenus completes after them, so each reports its close. The
 *   batch runs only if it's every close in the document, of one menu tree,
 *   all ready; otherwise each is Base UI's, a frame later
 *   (`completesEveryClose`).
 * - A keyboard or programmatic close (Escape, an item press, `open` set to
 *   false) completes then, if the popup's own animations list none running.
 * - A close a press made on `pointerdown` (an outside press, a backdrop, a
 *   consumer's `onPointerDown`) is left to Base UI, which completes it a
 *   frame later: the press's `mousedown`, in the same task, still moves
 *   focus, and the focus manager returns focus as the popup unmounts, which
 *   has to come after that. A next task (`setTimeout(0)`, a
 *   `MessageChannel`) comes after the frame that input starts in Chromium,
 *   so completing there would cost that frame too, for nothing.
 * - Where Base UI completes a close at once itself (no `getAnimations()`, or
 *   its animations turned off), the close is Base UI's: its unmount reports
 *   the close each time it's called.
 *
 * The unmount runs in `flushSync`, as Base UI's own completion does. `store`
 * is the surface store of the popup's level (the root's or a submenu's), and
 * `depth` its menu depth; a popup with no store has no Base UI root of ours
 * to ask.
 */
export function useCloseInOneFrame(
  store: ListboxStore | null | undefined,
  depth: number,
): (element: Element | null) => void {
  // Whether a press closed it, read as `open` goes false: the open cell
  // keeps the close's cause only while the change is being written, and the
  // press is being dispatched only then.
  const pressed = React.useRef(false)
  useIsoLayoutEffect(() => {
    if (!store) return undefined
    return store.observe('open', (isOpen) => {
      pressed.current = !isOpen && closedByPress(getCloseCause(store))
    })
  }, [store])

  const registry = getElementRegistry(useMenuTree())
  const observed = React.useRef<{
    element: Element
    observer: MutationObserver
  } | null>(null)
  return React.useCallback(
    (element: Element | null) => {
      if (observed.current?.element === element) return
      observed.current?.observer.disconnect()
      observed.current = null
      if (!element || !store) return
      const popup = element
      const complete = () => {
        // Base UI's close is pending only while the attribute is on.
        if (!popup.isConnected || !popup.hasAttribute('data-ending-style')) {
          return
        }
        if (store.select('open') || pressed.current) return
        if (completesAtOnce(popup) || playsExit(popup)) return
        const actions = popupActionsOf(store).current
        if (actions) flushSync(() => actions.unmount())
      }
      const observer = new MutationObserver(() => {
        if (popup.hasAttribute('data-ending-style')) {
          enqueue({ popup, registry, depth, complete })
        }
      })
      observer.observe(popup, {
        attributes: true,
        attributeFilter: ['data-ending-style'],
      })
      observed.current = { element: popup, observer }
    },
    [store, depth, registry],
  )
}
