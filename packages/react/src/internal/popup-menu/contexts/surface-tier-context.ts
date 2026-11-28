'use client'

import { Store } from '@base-ui/utils/store'
import * as React from 'react'
import {
  ListboxSurfaceTier,
  SurfaceTierContext,
} from '../../listbox/contexts/surface-tier-context.js'
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
 * root, `PopupMenu.SubmenuRoot`, `PopupMenu.Subpage`) and provided above the
 * level's trigger, positioner and popup, so they read it as its surface
 * does. Every field is set when it's made and never changes; what
 * changes is read through store selectors (the checkbox selection, made
 * later, through its own small store). The level's settings, which change
 * with its props, aren't on the tier: they ride a context of their own
 * (`SurfaceSettingsContext`), rendered with the level.
 *
 * A part finds the tier of the surface it renders in with
 * `findSurfaceTier(tier, store)`, by its Surface's store: a submenu trigger
 * sits under its submenu's tier, and its row belongs to the tier above.
 */
export class MenuSurfaceTier extends ListboxSurfaceTier {
  /** The tier around this one: the parent surface's, or an outer menu's. */
  declare readonly parent: MenuSurfaceTier | null
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

  /**
   * Whether the level itself is disabled, as last committed (read from a ref
   * an insertion effect writes): the root's `disabled`, or a submenu's own
   * (its prop or its actions'). A subpage has none of its own.
   */
  readonly isOwnDisabled: () => boolean
  /** Whether this is a menu root's tier, where a level's `disabled` ends. */
  readonly isRoot: boolean

  constructor(
    store: ListboxStore,
    parent: MenuSurfaceTier | null,
    depth: number,
    options: {
      submenu?: SubmenuHandle
      isOwnDisabled?: () => boolean
      isRoot?: boolean
    } = {},
  ) {
    super(store, parent, depth)
    this.submenu = options.submenu ?? parent?.submenu ?? null
    this.isOwnDisabled = options.isOwnDisabled ?? (() => false)
    this.isRoot = options.isRoot ?? false
  }
}

/**
 * Whether the level `tier` is in is disabled, as last committed: its own or
 * any level's above it in the same menu tree, up to its root (a root nested
 * in another menu's content doesn't read the outer one's). What a gate reads
 * when a change is asked, at any depth, in the commit that changes it too.
 */
export function isLevelDisabled(tier: MenuSurfaceTier | null): boolean {
  for (let current = tier; current; current = current.parent) {
    if (current.isOwnDisabled()) return true
    if (current.isRoot) return false
  }
  return false
}

/** Where a surface tier holds its checkbox selection, once it's made. */
export type CheckboxSelectionSlot = Store<{
  current: CheckboxSelectionStore | null
}>

export { SurfaceTierContext }

export function useMaybeMenuSurfaceTier(): MenuSurfaceTier | null {
  const tier = React.useContext(SurfaceTierContext)
  return tier instanceof MenuSurfaceTier ? tier : null
}

const OUTSIDE_A_MENU = {
  menu: 'PopupMenu components must be used within a PopupMenu.Root or ContextMenu.Root',
  listbox: 'Listbox components must be used within a Listbox provider',
}

/**
 * The menu tier of the surface a part renders in. Throws outside a menu,
 * with the message of the published context the part read before (`menu`
 * for `PopupMenuContext`, `listbox` for `ListboxContext`).
 */
export function useMenuSurfaceTier(
  outside: keyof typeof OUTSIDE_A_MENU = 'menu',
): MenuSurfaceTier {
  const tier = useMaybeMenuSurfaceTier()
  if (!tier) throw new Error(OUTSIDE_A_MENU[outside])
  return tier
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
