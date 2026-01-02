'use client'

import * as React from 'react'

/**
 * Context for the radio group item
 */
export interface MenuRadioGroupItemContextValue {
  /** Whether the radio item is checked */
  checked: boolean
  /** Whether the item is disabled */
  disabled: boolean
}

const MenuRadioGroupItemContext =
  React.createContext<MenuRadioGroupItemContextValue | null>(null)

if (process.env.NODE_ENV !== 'production') {
  MenuRadioGroupItemContext.displayName = 'MenuRadioGroupItemContext'
}

/**
 * Hook to access the radio group item context.
 * Must be used within a MenuRadioGroupItem component.
 */
export function useMenuRadioGroupItemContext(): MenuRadioGroupItemContextValue {
  const context = React.useContext(MenuRadioGroupItemContext)
  if (!context) {
    throw new Error(
      'useMenuRadioGroupItemContext must be used within a MenuRadioGroupItem component',
    )
  }
  return context
}

export { MenuRadioGroupItemContext }
