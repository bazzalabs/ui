'use client'

import * as React from 'react'
import type { FocusOwnerStore } from '../store/FocusOwnerStore.js'

// ============================================================================
// Focus Owner Context
// ============================================================================

const FocusOwnerContext = React.createContext<FocusOwnerStore | null>(null)

export function useFocusOwner(): FocusOwnerStore {
  const context = React.useContext(FocusOwnerContext)
  if (!context) {
    throw new Error(
      'FocusOwner components must be used within a FocusOwnerProvider',
    )
  }
  return context
}

export function useMaybeFocusOwner(): FocusOwnerStore | null {
  return React.useContext(FocusOwnerContext)
}

export { FocusOwnerContext }
