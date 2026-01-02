'use client'

import * as React from 'react'

/**
 * Context for the submenu
 */
export interface MenuSubmenuContextValue {
  /** Unique ID for this submenu's surface */
  submenuId: string
  /** ID of the trigger element */
  triggerId: string
  /** Whether the submenu is open */
  open: boolean
  /** Set the submenu open state */
  setOpen: (open: boolean) => void
  /** Depth in the menu hierarchy */
  depth: number
  /** Parent surface ID */
  parentSurfaceId: string
}

const MenuSubmenuContext = React.createContext<MenuSubmenuContextValue | null>(
  null,
)

if (process.env.NODE_ENV !== 'production') {
  MenuSubmenuContext.displayName = 'MenuSubmenuContext'
}

/**
 * Hook to access the submenu context.
 * Must be used within a MenuSubmenu component.
 */
export function useMenuSubmenuContext(): MenuSubmenuContextValue {
  const context = React.useContext(MenuSubmenuContext)
  if (!context) {
    throw new Error(
      'useMenuSubmenuContext must be used within a MenuSubmenu component',
    )
  }
  return context
}

/**
 * Hook to optionally access the submenu context.
 * Returns null if not within a MenuSubmenu component.
 */
export function useOptionalMenuSubmenuContext(): MenuSubmenuContextValue | null {
  return React.useContext(MenuSubmenuContext)
}

export { MenuSubmenuContext }
