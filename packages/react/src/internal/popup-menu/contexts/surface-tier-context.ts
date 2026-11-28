'use client'

import * as React from 'react'
import {
  getPendingRows,
  type ListboxStore,
  setPendingRows,
} from '../../listbox/store/ListboxStore.js'
import { CheckboxSelectionStore } from '../store/CheckboxSelectionStore.js'
import type { SubmenuHandle } from './submenu-context.js'

// ============================================================================
// Surface Tier
// ============================================================================

/**
 * What one surface's store shares with the parts that render for it, apart
 * from its published contexts (see "Tier contexts" in packages/react/AGENTS.md).
 * One per surface store, made where the store is (`PopupMenuProviders` for a
 * root, `PopupMenu.SubmenuRoot`, `PopupMenu.Subpage`), or by a Surface whose
 * store has none, so a submenu's trigger, positioner and popup read it as its
 * surface does. Every field is set when it's made and never changes; what
 * changes is read through store selectors.
 *
 * A part finds the tier of the surface it renders in with
 * `findSurfaceTier(tier, store)`, by its Surface's store: a submenu trigger
 * sits under its submenu's tier, and its row belongs to the tier above.
 */
export class MenuSurfaceTier {
  /** The surface's store. */
  readonly store: ListboxStore
  /** The tier around this one: the parent surface's, or an outer menu's. */
  readonly parent: MenuSurfaceTier | null
  /**
   * The submenu the surface opens in: its own, or the one around it (a
   * subpage of a submenu shares its submenu, as the root of a menu nested
   * in a submenu does).
   */
  readonly submenu: SubmenuHandle | null
  /** The surface element, set by its Surface's ref. */
  readonly surfaceRef: { current: HTMLElement | null } = { current: null }
  /**
   * Range and drag selection over the surface's checkbox rows. A Surface
   * that mounts claims it (`claim`), which starts it fresh, as a store made
   * per Surface did.
   */
  readonly selection: CheckboxSelectionStore

  constructor(
    store: ListboxStore,
    parent: MenuSurfaceTier | null,
    submenu?: SubmenuHandle,
  ) {
    this.store = store
    this.parent = parent
    this.submenu = submenu ?? parent?.submenu ?? null
    this.selection = createSelection(store, this.surfaceRef)
  }
}

function createSelection(
  store: ListboxStore,
  surfaceRef: { current: HTMLElement | null },
): CheckboxSelectionStore {
  return new CheckboxSelectionStore({
    getVisibleItemIds: () => store.getVisibleItemIds(),
    getItemElement: (id) =>
      store.context.refs.itemRefs.get(id)?.current ?? null,
    getScrollElement: () => {
      const listElement = store.context.refs.listRef.current
      const scrollElement =
        store.context.refs.listScrollContainerRef.current ??
        (listElement ? store.getScrollResetElement(listElement) : null)
      // Never auto-scroll an ancestor outside this surface (the page or an
      // app shell); fall back to the list element itself.
      if (
        scrollElement &&
        surfaceRef.current &&
        !surfaceRef.current.contains(scrollElement)
      ) {
        return listElement
      }
      return scrollElement
    },
    setHighlightedId: (id) => store.setHighlightedId(id, 'pointer'),
    observeOpen: (listener) => store.observe('open', (open) => listener(open)),
    getPreview: () => getPendingRows(store),
    setPreview: (preview) => setPendingRows(store, preview),
  })
}

export const SurfaceTierContext = React.createContext<MenuSurfaceTier | null>(
  null,
)

export function useMaybeMenuSurfaceTier(): MenuSurfaceTier | null {
  return React.useContext(SurfaceTierContext)
}

/** The tier whose store is `store`: `tier` or one around it. */
export function findSurfaceTier(
  tier: MenuSurfaceTier | null,
  store: ListboxStore | null | undefined,
): MenuSurfaceTier | null {
  if (!store) return null
  for (let current = tier; current; current = current.parent) {
    if (current.store === store) return current
  }
  return null
}
