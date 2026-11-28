'use client'

import { ReactStore } from '@base-ui/utils/store'
import type { AimGuardController } from '@bazza-ui/menu-core'
import * as React from 'react'
import type { FocusZoneRegistry } from '../store/FocusZoneRegistry.js'
import type { MenuTreeStore } from '../store/MenuTreeStore.js'
import type { ComponentName } from './component-name-context.js'
import type { PopupMenuDebugContextValue } from './popup-menu-debug-context.js'

// ============================================================================
// Menu Tree Context
// ============================================================================

export interface MenuTreeSettingsState {
  /** The root's debug visualization flags. */
  debug: PopupMenuDebugContextValue
}

/**
 * A root's settings that can change: made with the root's first props by
 * `PopupMenuProviders` and synced from later ones (`useSyncedValue`).
 */
export class MenuTreeSettings extends ReactStore<MenuTreeSettingsState> {}

/**
 * Where a menu root keeps its aim guard, once a submenu trigger has made it:
 * one per `PopupMenuProviders`, for as long as it's mounted, so every tree
 * tier it makes (a new tree, a new component name) shares the guard its
 * triggers hold. The providers dispose it when they unmount.
 */
export interface AimGuardHolder {
  current: AimGuardController | null
}

/**
 * The tree tier: what one menu root's parts share, provided once by
 * `PopupMenuProviders` with `MenuTreeContext`. Every field is set when it's
 * made and never changes; it's made again only for a new tree or component
 * name. What changes is read through `settings`. The aim guard is the one
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
    readonly settings: MenuTreeSettings,
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

  /** The aim guard, made by `create` the first time the root asks for it. */
  ensureAimGuard(
    create: (settings: MenuTreeSettings) => AimGuardController,
  ): AimGuardController {
    this.#aimGuard.current ??= create(this.settings)
    return this.#aimGuard.current
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
