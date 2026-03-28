'use client'

import * as React from 'react'

/**
 * Context value for ComboboxItem.
 * Provides item state to child components like ItemIndicator.
 *
 * @template Value - The type of the item value (can be a primitive or object)
 */
export interface ComboboxItemContextValue<Value = unknown> {
  /** Unique ID for the item element */
  id: string
  /** The item's value */
  value: Value
  /** The text value/label for this item */
  textValue: string | undefined
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
export function useComboboxItemContext<
  Value = unknown,
>(): ComboboxItemContextValue<Value> {
  const context = React.useContext(ComboboxItemContext)
  if (!context) {
    throw new Error(
      'ComboboxItem child components must be used within a Combobox.Item',
    )
  }
  return context as ComboboxItemContextValue<Value>
}

/**
 * Hook to optionally access the ComboboxItem context.
 * Returns null if used outside a ComboboxItem.
 */
export function useMaybeComboboxItemContext<
  Value = unknown,
>(): ComboboxItemContextValue<Value> | null {
  return React.useContext(
    ComboboxItemContext,
  ) as ComboboxItemContextValue<Value> | null
}

export { ComboboxItemContext }
