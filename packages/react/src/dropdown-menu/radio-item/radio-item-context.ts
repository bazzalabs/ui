'use client'

import * as React from 'react'

export interface RadioItemContextValue {
  /** Whether this radio item is currently selected */
  checked: boolean
  /** Whether this radio item is currently highlighted */
  highlighted: boolean
  /** Whether this radio item is disabled */
  disabled: boolean
}

const RadioItemContext = React.createContext<RadioItemContextValue | null>(null)

export function useRadioItemContext(): RadioItemContextValue {
  const context = React.useContext(RadioItemContext)
  if (!context) {
    throw new Error(
      'DropdownMenu.RadioItemIndicator must be used within DropdownMenu.RadioItem',
    )
  }
  return context
}

export { RadioItemContext }
