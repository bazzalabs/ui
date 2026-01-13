'use client'

import * as React from 'react'

// ============================================================================
// Item Context (for child components like indicators to access item state)
// ============================================================================

export interface ItemContextValue {
  /** Unique ID for this item (for DOM id attribute) */
  id: string
  /** Whether the item is highlighted */
  highlighted: boolean
  /** Whether the item is disabled */
  disabled: boolean
  /** Keyboard shortcut for this item */
  shortcut?: string
}

const ItemContext = React.createContext<ItemContextValue | null>(null)

export function useItemContext(): ItemContextValue {
  const context = React.useContext(ItemContext)
  if (!context) {
    throw new Error('Item child components must be used within an Item')
  }
  return context
}

export function useMaybeItemContext(): ItemContextValue | null {
  return React.useContext(ItemContext)
}

export { ItemContext }
