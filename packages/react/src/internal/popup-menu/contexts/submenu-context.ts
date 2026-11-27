'use client'

import { ReactStore } from '@base-ui/utils/store'
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
   * Latch set by explicit close actions (keyboard ArrowLeft/Ctrl+H/Escape-in-submenu,
   * or clicking the open trigger). While set and the trigger remains highlighted,
   * pointer/keyboard auto-open is suppressed. Reset when highlight leaves the trigger.
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
}

/**
 * One submenu, as its surface tier holds it: what never changes for the
 * submenu's lifetime, with `closeRootOnEsc` in its state. Its open state is
 * the submenu store's (`store.state.open`). Made by `PopupMenu.SubmenuRoot`.
 */
export class SubmenuHandle extends ReactStore<SubmenuHandleState> {
  readonly suppressAutoOpenRef: React.MutableRefObject<boolean> = {
    current: false,
  }
  readonly triggerRef: React.RefObject<HTMLElement | null> = { current: null }
  readonly contentRef: React.RefObject<HTMLElement | null> = { current: null }

  constructor(
    /** The submenu's store. */
    readonly store: ListboxStore,
    readonly setOpen: SubmenuContextValue['setOpen'],
    readonly parentSurfaceId: string,
    readonly childSurfaceId: string,
    closeRootOnEsc: boolean,
  ) {
    super({ closeRootOnEsc })
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
