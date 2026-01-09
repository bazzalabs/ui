'use client'

import * as React from 'react'
import type { FocusOwnerStore } from '../store/FocusOwnerStore.js'

/**
 * Context for the FocusOwnerStore.
 * Provides access to focus ownership tracking across the menu tree.
 */
const FocusOwnerCtx = React.createContext<FocusOwnerStore | null>(null)

/**
 * Hook to access the FocusOwnerStore.
 * Must be used within a FocusOwnerProvider.
 */
export const useFocusOwner = (): FocusOwnerStore => {
  const store = React.useContext(FocusOwnerCtx)
  if (!store) {
    throw new Error('useFocusOwner must be used within a FocusOwnerProvider')
  }
  return store
}

export { FocusOwnerCtx }
