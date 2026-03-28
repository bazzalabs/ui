'use client'

import * as React from 'react'
import type { HighlightChangeEventDetails } from '../../popup-menu/events.js'
import type { ListboxStore, VirtualItem } from '../store/ListboxStore.js'

/**
 * Virtualization configuration passed from Root/Submenu to Surface.
 */
export interface VirtualizationConfig {
  /** Whether virtualization mode is enabled */
  virtualized: boolean
  /** Pre-registered items for virtualization */
  items: VirtualItem[]
  /**
   * Callback when highlighted item changes (for scroll sync).
   * The third parameter contains event details including the reason for the change.
   */
  onHighlightChange?: (
    id: string | null,
    index: number,
    eventDetails: HighlightChangeEventDetails,
  ) => void
}

export interface ListboxContextValue {
  /** The Listbox store instance */
  store: ListboxStore
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

const ListboxContext = React.createContext<ListboxContextValue | null>(null)

export function useListboxContext(): ListboxContextValue {
  const context = React.useContext(ListboxContext)
  if (!context) {
    throw new Error('Listbox components must be used within a Listbox provider')
  }
  return context
}

export function useMaybeListboxContext(): ListboxContextValue | null {
  return React.useContext(ListboxContext)
}

export { ListboxContext }
