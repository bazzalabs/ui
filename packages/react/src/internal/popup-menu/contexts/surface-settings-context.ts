'use client'

import * as React from 'react'
import type { PopupMenuContextValue } from './popup-menu-context.js'

/**
 * A menu level's settings: what `PopupMenuContext` publishes for the level,
 * but its store and depth (its surface tier's own fields).
 */
export type MenuSurfaceSettings = Omit<PopupMenuContextValue, 'store' | 'depth'>

/**
 * The settings a menu level renders (a root's, from its props; a
 * submenu's, its parent's with its own `disabled`, `registerSurface` and
 * virtualization), provided by the level (`PopupMenuProviders`,
 * `SubmenuRoot`; a subpage shares its popup's). Unpublished, so a consumer's
 * own provider of a published context doesn't reach the parts below it.
 *
 * Its value is the one tier context value that changes: a part rendered in
 * the commit that changes a setting renders the new value in that commit.
 * It's memoised on the settings, so it changes only when one does. A gate
 * never reads it when a change is asked: what a gate decides on is read from
 * committed refs (`isLevelDisabled`), and a handler reads the value its
 * committed render closed over.
 */
const SurfaceSettingsContext = React.createContext<MenuSurfaceSettings | null>(
  null,
)

if (process.env.NODE_ENV !== 'production') {
  SurfaceSettingsContext.displayName = 'SurfaceSettingsContext'
}

export function useMaybeMenuSurfaceSettings(): MenuSurfaceSettings | null {
  return React.useContext(SurfaceSettingsContext)
}

const OUTSIDE_A_MENU = {
  menu: 'PopupMenu components must be used within a PopupMenu.Root or ContextMenu.Root',
  listbox: 'Listbox components must be used within a Listbox provider',
}

/**
 * The settings of the level a part renders in. Throws outside a menu, with
 * the message of the published context the part read before (`menu` for
 * `PopupMenuContext`, `listbox` for `ListboxContext`).
 */
export function useMenuSurfaceSettings(
  outside: keyof typeof OUTSIDE_A_MENU = 'menu',
): MenuSurfaceSettings {
  const settings = React.useContext(SurfaceSettingsContext)
  if (!settings) throw new Error(OUTSIDE_A_MENU[outside])
  return settings
}

export { SurfaceSettingsContext }
