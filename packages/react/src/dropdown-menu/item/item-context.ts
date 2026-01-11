'use client'

import * as React from 'react'

export interface ItemContextValue {
  /** The keyboard shortcut for this item */
  shortcut: string | undefined
}

export const ItemContext = React.createContext<ItemContextValue | null>(null)

export function useItemContext(): ItemContextValue {
  const context = React.useContext(ItemContext)
  if (!context) {
    throw new Error(
      'DropdownMenu.Shortcut must be used within DropdownMenu.Item',
    )
  }
  return context
}

export function useMaybeItemContext(): ItemContextValue | null {
  return React.useContext(ItemContext)
}
