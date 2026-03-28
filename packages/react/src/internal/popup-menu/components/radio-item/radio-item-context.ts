'use client'

import * as React from 'react'
import type { ItemContextValue } from '../../../listbox/index.js'

/**
 * Context value for radio menu items.
 * Extends ItemContextValue with radio-specific state.
 */
export interface RadioItemContextValue extends ItemContextValue {
  /** Whether this radio item is currently selected */
  checked: boolean
}

const RadioItemContext = React.createContext<RadioItemContextValue | null>(null)

export function useRadioItemContext(): RadioItemContextValue {
  const context = React.useContext(RadioItemContext)
  if (!context) {
    throw new Error(
      'PopupMenu.RadioItemIndicator must be used within PopupMenu.RadioItem',
    )
  }
  return context
}

export { RadioItemContext }
