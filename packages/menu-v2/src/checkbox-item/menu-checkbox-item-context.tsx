'use client'

import * as React from 'react'

/**
 * Context for the checkbox item
 */
export interface MenuCheckboxItemContextValue {
  /** Whether the checkbox is checked */
  checked: boolean
  /** Whether the item is disabled */
  disabled: boolean
}

const MenuCheckboxItemContext =
  React.createContext<MenuCheckboxItemContextValue | null>(null)

if (process.env.NODE_ENV !== 'production') {
  MenuCheckboxItemContext.displayName = 'MenuCheckboxItemContext'
}

/**
 * Hook to access the checkbox item context.
 * Must be used within a MenuCheckboxItem component.
 */
export function useMenuCheckboxItemContext(): MenuCheckboxItemContextValue {
  const context = React.useContext(MenuCheckboxItemContext)
  if (!context) {
    throw new Error(
      'useMenuCheckboxItemContext must be used within a MenuCheckboxItem component',
    )
  }
  return context
}

export { MenuCheckboxItemContext }
