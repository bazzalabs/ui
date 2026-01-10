'use client'

import * as React from 'react'

export interface CheckboxItemContextValue {
  /** Whether this checkbox item is currently checked */
  checked: boolean
  /** Whether this checkbox item is currently highlighted */
  highlighted: boolean
  /** Whether this checkbox item is disabled */
  disabled: boolean
  /** Toggle the checked state without triggering closeOnClick */
  toggle: () => void
}

const CheckboxItemContext =
  React.createContext<CheckboxItemContextValue | null>(null)

export function useCheckboxItemContext(): CheckboxItemContextValue {
  const context = React.useContext(CheckboxItemContext)
  if (!context) {
    throw new Error(
      'DropdownMenu.CheckboxItemIndicator must be used within DropdownMenu.CheckboxItem',
    )
  }
  return context
}

export { CheckboxItemContext }
