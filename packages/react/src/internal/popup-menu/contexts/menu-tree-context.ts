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
 * The tree tier: what one menu root's parts share, provided once by
 * `PopupMenuProviders` with `MenuTreeContext`. Every field is set when it's
 * made and never changes; it's made again only for a new tree or component
 * name. What changes is read through `settings`.
 */
export class MenuTreeTier {
  constructor(
    /** The root's tree (see "Menu Tree Store" in the engine CONTEXT.md). */
    readonly tree: MenuTreeStore,
    /** The member the tree renders, for `bazzaui-*` slot attributes. */
    readonly componentName: ComponentName | null,
    readonly settings: MenuTreeSettings,
    /** Safe-polygon navigation toward the tree's submenus. */
    readonly aimGuard: AimGuardController,
    /** Each surface's focus zones and parent, for Tab. */
    readonly focusZones: FocusZoneRegistry,
  ) {}
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
