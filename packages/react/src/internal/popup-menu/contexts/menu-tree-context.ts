'use client'

import type { AimGuardController } from '@bazza-ui/menu-core'
import * as React from 'react'
import type { FocusZoneRegistry } from '../store/FocusZoneRegistry.js'
import type { MenuTreeStore } from '../store/MenuTreeStore.js'
import type { ComponentName } from './component-name-context.js'
import type { PopupMenuDebugContextValue } from './popup-menu-debug-context.js'

// ============================================================================
// Menu Tree Context
// ============================================================================

/**
 * Where a menu root keeps its aim guard, once a submenu trigger has made it:
 * one per `PopupMenuProviders`, for as long as it's mounted, so every tree
 * tier it makes (a new tree, a new component name) shares the guard its
 * triggers hold. The providers dispose it when they unmount.
 */
export interface AimGuardHolder {
  current: AimGuardController | null
  /**
   * The tier the providers made last, set from their layout effect: the
   * guard reads the root's debug flags through it, so a guard made by an
   * earlier tier (a new tree, Fast Refresh) follows the current tree.
   */
  latest: MenuTreeTier | null
}

/**
 * The tree tier: what one menu root's parts share, provided once by
 * `PopupMenuProviders` with `MenuTreeContext`. Every field is set when it's
 * made and never changes; it's made again only for a new tree or component
 * name. What changes is the tree's state (the root's settings among it),
 * read through the tree's selectors. The aim guard is the one
 * thing made later: by the root's first submenu trigger, once
 * (`ensureAimGuard`), into the root's holder, which outlives the tier, so a
 * tree with no submenu never builds it, and a member with no submenu
 * trigger doesn't ship it.
 */
export class MenuTreeTier {
  readonly #aimGuard: AimGuardHolder

  constructor(
    /** The root's tree (see "Menu Tree Store" in the engine CONTEXT.md). */
    readonly tree: MenuTreeStore,
    /** The member the tree renders, for `bazzaui-*` slot attributes. */
    readonly componentName: ComponentName | null,
    /**
     * The root's debug flags as the tier is made, which stand for the
     * tree's until the root's providers first sync them (`debugFlags`).
     */
    readonly initialDebug: PopupMenuDebugContextValue,
    /** Each surface's focus zones and parent, for Tab. */
    readonly focusZones: FocusZoneRegistry,
    /** The root's aim guard, shared by every tier the root makes. */
    aimGuard: AimGuardHolder,
  ) {
    this.#aimGuard = aimGuard
  }

  /**
   * Safe-polygon navigation toward the tree's submenus, or null while no
   * submenu trigger has made it. Read it when it's needed (in a handler or
   * an effect), not while rendering.
   */
  get aimGuard(): AimGuardController | null {
    return this.#aimGuard.current
  }

  /** The root's debug flags now, read when they're needed. */
  debugFlags(): PopupMenuDebugContextValue {
    return this.tree.state.debug ?? this.initialDebug
  }

  /**
   * The aim guard, made by `create` the first time the root asks for it,
   * with a reader of the root's debug flags: the latest tier's
   * (`AimGuardHolder.latest`), this one's until the providers set it.
   */
  ensureAimGuard(
    create: (debug: () => PopupMenuDebugContextValue) => AimGuardController,
  ): AimGuardController {
    const holder = this.#aimGuard
    holder.current ??= create(() => (holder.latest ?? this).debugFlags())
    return holder.current
  }
}

const MenuTreeContext = React.createContext<MenuTreeTier | null>(null)

export function useMenuTree(): MenuTreeStore {
  const context = React.useContext(MenuTreeContext)
  if (!context) {
    throw new Error('Menu components must be used within a menu root')
  }
  return context.tree
}

export function useMaybeMenuTree(): MenuTreeStore | null {
  return React.useContext(MenuTreeContext)?.tree ?? null
}

export function useMaybeMenuTreeTier(): MenuTreeTier | null {
  return React.useContext(MenuTreeContext)
}

export { MenuTreeContext }
