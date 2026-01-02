'use client'

import * as React from 'react'

/**
 * Context for a menu surface (root or submenu level)
 */
export interface MenuSurfaceContextValue {
  /** Unique ID for this surface */
  surfaceId: string
  /** Depth in the menu hierarchy (0 = root) */
  depth: number
  /** Parent surface ID (null for root) */
  parentSurfaceId: string | null
  /** ID for the list element (used for aria-controls) */
  listId: string
}

const MenuSurfaceContext = React.createContext<MenuSurfaceContextValue | null>(
  null,
)

if (process.env.NODE_ENV !== 'production') {
  MenuSurfaceContext.displayName = 'MenuSurfaceContext'
}

/**
 * Hook to access the menu surface context.
 * Must be used within a MenuSurface component.
 */
export function useMenuSurfaceContext(): MenuSurfaceContextValue {
  const context = React.useContext(MenuSurfaceContext)
  if (!context) {
    throw new Error(
      'useMenuSurfaceContext must be used within a MenuSurface component',
    )
  }
  return context
}

/**
 * Hook to optionally access the menu surface context.
 * Returns null if not within a MenuSurface component.
 */
export function useOptionalMenuSurfaceContext(): MenuSurfaceContextValue | null {
  return React.useContext(MenuSurfaceContext)
}

export { MenuSurfaceContext }
