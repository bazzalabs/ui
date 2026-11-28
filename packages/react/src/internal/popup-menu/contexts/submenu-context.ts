'use client'

import { ReactStore } from '@base-ui/utils/store'
import type { OpenRequestResult } from '@bazza-ui/menu-core'
import type * as React from 'react'
import type { ListboxStore } from '../../listbox/store/ListboxStore.js'
import type { PopupMenuOpenChangeReason } from '../events.js'
import { useMaybeStore } from '../hooks/use-maybe-store.js'
import { useMaybeMenuSurfaceTier } from './surface-tier-context.js'

export interface SubmenuContextValue {
  /** Whether the submenu is open */
  open: boolean
  /**
   * Asks the submenu to open or close, for `reason` (`'none'` when left
   * out): the close policy decides, and the consumer's `onOpenChange` hears
   * it with its reason and event.
   */
  setOpen: (
    open: boolean,
    reason?: PopupMenuOpenChangeReason,
    event?: Event,
  ) => void
  /**
   * Whether an explicit close (keyboard ArrowLeft/Ctrl+H/Escape-in-submenu,
   * Tab, or clicking the open trigger) suppresses pointer/keyboard auto-open
   * while the trigger remains highlighted; reset when highlight leaves the
   * trigger. The submenu trigger's controller keeps it: reading `current`
   * reads it, setting it to `true` is an explicit close and setting it to
   * `false` clears it. A write before the trigger mounts applies when it
   * does.
   */
  suppressAutoOpenRef: React.MutableRefObject<boolean>
  /** Reference to the trigger element */
  triggerRef: React.RefObject<HTMLElement | null>
  /** Reference to the submenu content element (for aim guard rect calculations) */
  contentRef: React.RefObject<HTMLElement | null>
  /** Surface ID of the parent menu (for keyboard navigation back) */
  parentSurfaceId: string
  /** Surface ID of this submenu (for keyboard navigation into) */
  childSurfaceId: string
  /**
   * Whether pressing Escape in this submenu closes the entire menu from the root.
   * When true, Escape closes the entire menu tree.
   * When false, Escape only closes this submenu and moves focus to the parent.
   * @default true
   */
  closeRootOnEsc: boolean
}

interface SubmenuHandleState {
  closeRootOnEsc: boolean
  /** The trigger controller's suppression, mirrored for `suppressAutoOpenRef`. */
  suppressed: boolean
  /**
   * A suppression the trigger's controller hasn't taken yet (an explicit
   * close, or a write of `suppressAutoOpenRef`): `suppress` true suppresses,
   * false clears it. A new object for each, which the trigger's binding
   * takes and drops (`takeSuppression`); it waits for a trigger that hasn't
   * mounted.
   */
  suppression: { readonly suppress: boolean } | null
}

/**
 * One submenu, as its surface tier holds it: what never changes for the
 * submenu's lifetime, with `closeRootOnEsc` in its state. Its open state is
 * the submenu store's (`store.state.open`). Made by `PopupMenu.SubmenuRoot`.
 */
export class SubmenuHandle extends ReactStore<SubmenuHandleState> {
  readonly suppressAutoOpenRef: React.MutableRefObject<boolean>
  readonly triggerRef: React.RefObject<HTMLElement | null> = { current: null }
  readonly contentRef: React.RefObject<HTMLElement | null> = { current: null }

  constructor(
    /** The submenu's store. */
    readonly store: ListboxStore,
    readonly setOpen: SubmenuContextValue['setOpen'],
    /**
     * `setOpen`, returning what became of the change: what the trigger's
     * controller decides on, and what Base UI's details mirror.
     */
    readonly request: (
      open: boolean,
      reason: PopupMenuOpenChangeReason,
      event?: Event,
    ) => OpenRequestResult,
    readonly parentSurfaceId: string,
    readonly childSurfaceId: string,
    closeRootOnEsc: boolean,
  ) {
    super({ closeRootOnEsc, suppressed: false, suppression: null })
    const handle = this
    this.suppressAutoOpenRef = {
      get current() {
        const { suppression, suppressed } = handle.state
        return suppression ? suppression.suppress : suppressed
      },
      set current(value: boolean) {
        handle.set('suppression', { suppress: value })
      },
    }
  }

  /**
   * An explicit close of the submenu happened (a key, Tab): its trigger's
   * controller suppresses reopening on a highlight while the trigger keeps
   * it.
   */
  closeExplicitly() {
    this.set('suppression', { suppress: true })
  }

  #last: SubmenuContextValue | undefined

  /** The context value for this state, the same object until it changes. */
  value(open: boolean, closeRootOnEsc: boolean): SubmenuContextValue {
    const last = this.#last
    if (last && last.open === open && last.closeRootOnEsc === closeRootOnEsc) {
      return last
    }
    this.#last = {
      open,
      setOpen: this.setOpen,
      suppressAutoOpenRef: this.suppressAutoOpenRef,
      triggerRef: this.triggerRef,
      contentRef: this.contentRef,
      parentSurfaceId: this.parentSurfaceId,
      childSurfaceId: this.childSurfaceId,
      closeRootOnEsc,
    }
    return this.#last
  }
}

const selectOpen = (state: { open: boolean }) => state.open
const selectCloseRootOnEsc = (state: SubmenuHandleState) => state.closeRootOnEsc

/**
 * The submenu around the caller, from its surface tier; its open state and
 * `closeRootOnEsc` are read from their stores. Every caller in a render gets
 * the same value.
 */
export function useMaybeSubmenuContext(): SubmenuContextValue | null {
  const handle = useMaybeMenuSurfaceTier()?.submenu ?? null
  const open = useMaybeStore(handle?.store, selectOpen, false)
  const closeRootOnEsc = useMaybeStore(handle, selectCloseRootOnEsc, true)
  return handle ? handle.value(open, closeRootOnEsc) : null
}

export function useSubmenuContext(): SubmenuContextValue {
  const context = useMaybeSubmenuContext()
  if (!context) {
    throw new Error('SubmenuTrigger must be used within a Submenu')
  }
  return context
}
