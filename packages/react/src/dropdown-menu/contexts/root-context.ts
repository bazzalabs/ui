'use client'

import * as React from 'react'
import type {
  DropdownMenuStore,
  VirtualItem,
} from '../store/DropdownMenuStore.js'

/**
 * Virtualization configuration passed from Root/Submenu to Surface.
 */
export interface VirtualizationConfig {
  /** Whether virtualization mode is enabled */
  virtualized: boolean
  /** Pre-registered items for virtualization */
  items: VirtualItem[]
  /** Callback when highlighted item changes (for scroll sync) */
  onHighlightChange?: (id: string | null, index: number) => void
}

export interface RootContextValue {
  /** The DropdownMenu store instance */
  store: DropdownMenuStore
  /** Nesting depth: 0 = root menu, 1+ = submenu */
  depth: number
  /** Close the entire menu tree (deepest submenu to root, sequentially) */
  closeAll: () => void
  /** Register a surface (submenu) for closeAll tracking. Returns unregister function. */
  registerSurface: (
    depth: number,
    setOpen: (open: boolean) => void,
  ) => () => void
  /** Virtualization configuration (if enabled) */
  virtualization?: VirtualizationConfig
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
