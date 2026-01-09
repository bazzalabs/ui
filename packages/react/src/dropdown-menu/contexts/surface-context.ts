'use client'

import * as React from 'react'
import type { DropdownMenuStore } from '../store/DropdownMenuStore.js'

// Re-export types from the store for convenience
export type {
  FilterFn,
  ItemRegistration,
} from '../store/DropdownMenuStore.js'

// ============================================================================
// Surface Context
// ============================================================================

export interface SurfaceContextValue {
  /** The DropdownMenu store instance */
  store: DropdownMenuStore
  /** Unique identifier for this surface */
  surfaceId: string
}

const SurfaceContext = React.createContext<SurfaceContextValue | null>(null)

export function useSurfaceContext(): SurfaceContextValue {
  const context = React.useContext(SurfaceContext)
  if (!context) {
    throw new Error(
      'DropdownMenu.* components must be used within DropdownMenu.Surface',
    )
  }
  return context
}

export function useMaybeSurfaceContext(): SurfaceContextValue | null {
  return React.useContext(SurfaceContext)
}

export { SurfaceContext }

// ============================================================================
// Group Context (for items to know their parent group)
// ============================================================================

interface GroupContextValue {
  groupId: string
}

const GroupContext = React.createContext<GroupContextValue | null>(null)

export function useGroupContext(): GroupContextValue | null {
  return React.useContext(GroupContext)
}

export { GroupContext }
