'use client'

import * as React from 'react'

// ============================================================================
// Select Item Context
// ============================================================================
// Provides select-specific item state to child components.

export interface SelectItemContextValue {
  /** Unique ID for this item (for DOM id attribute) */
  id: string
  /** The value of this item */
  value: string
  /** The text value/label for this item */
  textValue: string | undefined
  /** Whether the item is highlighted */
  highlighted: boolean
  /** Whether the item is disabled */
  disabled: boolean
  /** Whether the item is selected */
  selected: boolean
}

const SelectItemContext = React.createContext<SelectItemContextValue | null>(
  null,
)

export function useSelectItemContext(): SelectItemContextValue {
  const context = React.useContext(SelectItemContext)
  if (!context) {
    throw new Error(
      'Select.Item child components must be used within a Select.Item',
    )
  }
  return context
}

export function useMaybeSelectItemContext(): SelectItemContextValue | null {
  return React.useContext(SelectItemContext)
}

export { SelectItemContext }
