'use client'

import * as React from 'react'
import type { ListboxStore } from '../store/ListboxStore.js'

// Re-export types from the store for convenience
export type {
  FilterFn,
  ItemRegistration,
} from '../store/ListboxStore.js'

// ============================================================================
// Surface Context
// ============================================================================

export interface SurfaceContextValue {
  /** The Listbox store instance */
  store: ListboxStore
  /** Unique identifier for this surface */
  surfaceId: string
}

const SurfaceContext = React.createContext<SurfaceContextValue | null>(null)

export function useSurfaceContext(): SurfaceContextValue {
  const context = React.useContext(SurfaceContext)
  if (!context) {
    throw new Error('Listbox components must be used within a Surface provider')
  }
  return context
}

export function useMaybeSurfaceContext(): SurfaceContextValue | null {
  return React.useContext(SurfaceContext)
}

export { SurfaceContext }
