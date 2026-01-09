'use client'

import * as React from 'react'
import type { DropdownMenuStore } from '../store/DropdownMenuStore.js'

export interface RootContextValue {
  /** The DropdownMenu store instance */
  store: DropdownMenuStore
  /** Nesting depth: 0 = root menu, 1+ = submenu */
  depth: number
}

const RootContext = React.createContext<RootContextValue | null>(null)

export function useRootContext(): RootContextValue {
  const context = React.useContext(RootContext)
  if (!context) {
    throw new Error(
      'DropdownMenu.* components must be used within DropdownMenu.Root',
    )
  }
  return context
}

export function useMaybeRootContext(): RootContextValue | null {
  return React.useContext(RootContext)
}

export { RootContext }
