'use client'

import * as React from 'react'

/**
 * Context value for ComboboxItem.
 * Provides item state to child components like ItemIndicator.
 */
export interface ComboboxItemContextValue {
  /** Unique ID for the item element */
  id: string
  /** The item's value */
  value: string
  /** Whether the item is highlighted (via keyboard or pointer) */
  highlighted: boolean
  /** Whether the item is disabled */
  disabled: boolean
  /** Whether the item is selected */
  selected: boolean
}

const ComboboxItemContext =
  React.createContext<ComboboxItemContextValue | null>(null)

/**
 * Hook to access the ComboboxItem context.
 * Throws if used outside a ComboboxItem.
 */
export function useComboboxItemContext(): ComboboxItemContextValue {
  const context = React.useContext(ComboboxItemContext)
  if (!context) {
    throw new Error(
      'ComboboxItem child components must be used within a Combobox.Item',
    )
  }
  return context
}

/**
 * Hook to optionally access the ComboboxItem context.
 * Returns null if used outside a ComboboxItem.
 */
export function useMaybeComboboxItemContext(): ComboboxItemContextValue | null {
  return React.useContext(ComboboxItemContext)
}

export { ComboboxItemContext }
