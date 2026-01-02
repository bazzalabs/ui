'use client'

import * as React from 'react'

/**
 * Context for a menu group
 */
export interface MenuGroupContextValue {
  /** ID of the group heading (for aria-labelledby) */
  headingId: string | undefined
  /** Set the heading ID */
  setHeadingId: (id: string) => void
}

const MenuGroupContext = React.createContext<MenuGroupContextValue | null>(null)

if (process.env.NODE_ENV !== 'production') {
  MenuGroupContext.displayName = 'MenuGroupContext'
}

/**
 * Hook to access the menu group context.
 */
export function useMenuGroupContext(): MenuGroupContextValue | null {
  return React.useContext(MenuGroupContext)
}

export { MenuGroupContext }
