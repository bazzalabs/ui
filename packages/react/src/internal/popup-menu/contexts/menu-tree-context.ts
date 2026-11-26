'use client'

import * as React from 'react'
import type { MenuTreeStore } from '../store/MenuTreeStore.js'

// ============================================================================
// Menu Tree Context
// ============================================================================

const MenuTreeContext = React.createContext<MenuTreeStore | null>(null)

/** The menu tree's store: its open chain, focus owner and elements. */
export function useMenuTree(): MenuTreeStore {
  const context = React.useContext(MenuTreeContext)
  if (!context) {
    throw new Error('Menu components must be used within a menu root')
  }
  return context
}

export function useMaybeMenuTree(): MenuTreeStore | null {
  return React.useContext(MenuTreeContext)
}

export { MenuTreeContext }
