'use client'

import * as React from 'react'

/**
 * Context value for navigatable/highlightable menu items.
 * This is the base context that all item types (Item, CheckboxItem, RadioItem) provide.
 */
export interface ItemContextValue {
  /** Unique ID for this item */
  id: string
  /** Whether the item is currently highlighted (via keyboard or pointer) */
  highlighted: boolean
  /** Whether the item is disabled */
  disabled: boolean
  /** Keyboard shortcut for this item */
  shortcut: string | undefined
}

export const ItemContext = React.createContext<ItemContextValue | null>(null)

/**
 * Returns the ItemContext value.
 * Throws if used outside of an Item, CheckboxItem, or RadioItem.
 */
export function useItemContext(): ItemContextValue {
  const context = React.useContext(ItemContext)
  if (!context) {
    throw new Error(
      'useItemContext must be used within DropdownMenu.Item, DropdownMenu.CheckboxItem, or DropdownMenu.RadioItem',
    )
  }
  return context
}

/**
 * Returns the ItemContext value, or null if not within an item.
 * Useful for components that can optionally be used within items.
 */
export function useMaybeItemContext(): ItemContextValue | null {
  return React.useContext(ItemContext)
}
