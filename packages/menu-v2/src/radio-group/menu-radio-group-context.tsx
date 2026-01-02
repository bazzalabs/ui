'use client'

import * as React from 'react'

/**
 * Context for the radio group
 */
export interface MenuRadioGroupContextValue {
  /** The current value of the radio group */
  value: string | undefined
  /** Whether the radio group is disabled */
  disabled: boolean
  /** Callback to change the value */
  onValueChange: (value: string) => void
}

const MenuRadioGroupContext =
  React.createContext<MenuRadioGroupContextValue | null>(null)

if (process.env.NODE_ENV !== 'production') {
  MenuRadioGroupContext.displayName = 'MenuRadioGroupContext'
}

/**
 * Hook to access the radio group context.
 * Must be used within a MenuRadioGroup component.
 */
export function useMenuRadioGroupContext(): MenuRadioGroupContextValue {
  const context = React.useContext(MenuRadioGroupContext)
  if (!context) {
    throw new Error(
      'useMenuRadioGroupContext must be used within a MenuRadioGroup component',
    )
  }
  return context
}

export { MenuRadioGroupContext }
