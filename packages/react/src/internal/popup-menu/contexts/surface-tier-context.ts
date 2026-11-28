'use client'

import { Store } from '@base-ui/utils/store'
import * as React from 'react'
import type { ListboxStore } from '../../listbox/store/ListboxStore.js'
import type { CheckboxSelectionStore } from '../store/CheckboxSelectionStore.js'
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
 * changes is read through store selectors (the checkbox selection, made
 * later, is read through its own small store).
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
   * Range and drag selection over the surface's checkbox rows, in a small
   * store of its own: `null` until the surface's first checkbox row makes it
   * (`ensureCheckboxSelection`, from an effect or a handler, never while
   * rendering), so a surface with no checkbox rows never builds it and a
   * member with no checkbox parts doesn't ship it. Parts that read it
   * subscribe (`useMaybeCheckboxSelection`), so they hear when it's made, or
   * read it in their handlers (`useCheckboxSelectionSlot`).
   * The Surface claims it (`claim`) once it's there, which starts it fresh
   * for a new Surface, as a store made per Surface did.
   */
  readonly selection: CheckboxSelectionSlot = new Store({
    current: null as CheckboxSelectionStore | null,
  })

  constructor(
    store: ListboxStore,
    parent: MenuSurfaceTier | null,
    submenu?: SubmenuHandle,
  ) {
    this.store = store
    this.parent = parent
    this.submenu = submenu ?? parent?.submenu ?? null
  }
}

/** Where a surface tier holds its checkbox selection, once it's made. */
export type CheckboxSelectionSlot = Store<{
  current: CheckboxSelectionStore | null
}>

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
