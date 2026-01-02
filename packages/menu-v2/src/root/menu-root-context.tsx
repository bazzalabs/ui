'use client'

import * as React from 'react'
import type { MenuStore } from '../store/index.js'

/**
 * Context for the menu root
 */
export interface MenuRootContextValue {
  /** The menu store instance */
  store: MenuStore
  /** Unique ID for this menu instance */
  menuId: string
}

const MenuRootContext = React.createContext<MenuRootContextValue | null>(null)

if (process.env.NODE_ENV !== 'production') {
  MenuRootContext.displayName = 'MenuRootContext'
}

/**
 * Hook to access the menu root context.
 * Must be used within a MenuRoot component.
 */
export function useMenuRootContext(): MenuRootContextValue {
  const context = React.useContext(MenuRootContext)
  if (!context) {
    throw new Error(
      'useMenuRootContext must be used within a MenuRoot component',
    )
  }
  return context
}

/**
 * Hook to optionally access the menu root context.
 * Returns null if not within a MenuRoot component.
 */
export function useOptionalMenuRootContext(): MenuRootContextValue | null {
  return React.useContext(MenuRootContext)
}

export { MenuRootContext }
