'use client'

import * as React from 'react'
import type { ItemContextValue } from '../../../listbox/index.js'

/**
 * Context value for checkbox menu items.
 * Extends ItemContextValue with checkbox-specific state.
 */
export interface CheckboxItemContextValue extends ItemContextValue {
  /** Whether this checkbox item is currently checked */
  checked: boolean
  /** Toggle the checked state */
  toggle: () => void
}

const CheckboxItemContext =
  React.createContext<CheckboxItemContextValue | null>(null)

export function useCheckboxItemContext(): CheckboxItemContextValue {
  const context = React.useContext(CheckboxItemContext)
  if (!context) {
    throw new Error(
      'PopupMenu.CheckboxItemIndicator must be used within PopupMenu.CheckboxItem',
    )
  }
  return context
}

export { CheckboxItemContext }
