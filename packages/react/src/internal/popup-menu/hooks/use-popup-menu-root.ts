'use client'

import * as React from 'react'
import { ListboxStore, type VirtualItem } from '../../listbox/index.js'
import type {
  VirtualAnchor,
  VirtualizationConfig,
} from '../contexts/popup-menu-context.js'
import { FocusOwnerStore } from '../store/FocusOwnerStore.js'
import { OpenChainStore } from '../store/OpenChainStore.js'

// ============================================================================
// Types
// ============================================================================

export interface UsePopupMenuRootParams {
  /**
   * Callback when the open state changes.
   */
  onOpenChange?: (open: boolean) => void

  /**
   * Whether the menu is initially open.
   * @default false
   */
  defaultOpen?: boolean

  /**
   * Whether virtualization mode is enabled.
   * @default false
   */
  virtualized?: boolean

  /**
   * Pre-registered items for virtualization.
   */
  items?: VirtualItem[]

  /**
   * Callback when the highlighted item changes.
   */
  onHighlightChange?: (id: string | null, index: number) => void
}

export interface UsePopupMenuRootReturn {
  /** The Listbox store instance */
  store: ListboxStore
  /** The FocusOwner store instance */
  focusOwnerStore: FocusOwnerStore
  /** The OpenChain store instance */
  openChainStore: OpenChainStore
  /** Register a surface (submenu) for closeAll tracking */
  registerSurface: (
    depth: number,
    setOpen: (open: boolean) => void,
  ) => () => void
  /** Close the entire menu tree */
  closeAll: () => void
  /** Virtualization configuration (if enabled) */
  virtualization: VirtualizationConfig | undefined
  /** Handle open state change (updates store and clears stores on close) */
  handleOpenChange: (open: boolean) => void
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook that creates and manages the core stores and utilities for popup menus.
 * Used by both DropdownMenu.Root and ContextMenu.Root.
 *
 * Provides:
 * - ListboxStore for item management
 * - FocusOwnerStore for focus tracking across submenus
 * - OpenChainStore for tracking open submenu chain
 * - Surface registry for closeAll functionality
 */
export function usePopupMenuRoot(
  params: UsePopupMenuRootParams = {},
): UsePopupMenuRootReturn {
  const {
    onOpenChange,
    defaultOpen = false,
    virtualized = false,
    items: itemsProp,
    onHighlightChange,
  } = params

  // Create the store instance
  const store = ListboxStore.useStore(
    undefined,
    { open: defaultOpen },
    {
      onOpenChange: onOpenChange ?? (() => {}),
    },
  )

  // Create focus owner store (single instance for entire menu tree)
  const focusOwnerStoreRef = React.useRef<FocusOwnerStore | null>(null)
  if (!focusOwnerStoreRef.current) {
    focusOwnerStoreRef.current = new FocusOwnerStore()
  }
  const focusOwnerStore = focusOwnerStoreRef.current

  // Create open chain store (single instance for entire menu tree)
  const openChainStoreRef = React.useRef<OpenChainStore | null>(null)
  if (!openChainStoreRef.current) {
    openChainStoreRef.current = new OpenChainStore()
  }
  const openChainStore = openChainStoreRef.current

  // Registry for tracking open submenus (for closeAll)
  type SurfaceEntry = { depth: number; setOpen: (open: boolean) => void }
  const surfaceRegistryRef = React.useRef<Map<string, SurfaceEntry>>(new Map())

  // Register a surface (submenu) for closeAll tracking
  const registerSurface = React.useCallback(
    (depth: number, setOpen: (open: boolean) => void) => {
      const id = Math.random().toString(36).slice(2)
      surfaceRegistryRef.current.set(id, { depth, setOpen })
      return () => {
        surfaceRegistryRef.current.delete(id)
      }
    },
    [],
  )

  // Close the entire menu tree from deepest submenu to root
  const closeAll = React.useCallback(() => {
    // Sort surfaces by depth (deepest first)
    const surfaces = [...surfaceRegistryRef.current.values()].sort(
      (a, b) => b.depth - a.depth,
    )

    // Close each submenu from deepest to shallowest
    for (const surface of surfaces) {
      surface.setOpen(false)
    }

    // Finally close the root
    store.setOpen(false)

    // Clear focus ownership and open chain
    focusOwnerStore.clearOwner()
    openChainStore.clear()
  }, [store, focusOwnerStore, openChainStore])

  // Handle open state change
  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      store.setOpen(newOpen)
      // Clear focus ownership and open chain when menu closes
      if (!newOpen) {
        focusOwnerStore.clearOwner()
        openChainStore.clear()
      }
    },
    [store, focusOwnerStore, openChainStore],
  )

  // Memoize virtualization config
  const virtualization = React.useMemo(() => {
    if (!virtualized) return undefined
    return {
      virtualized: true as const,
      items: itemsProp ?? [],
      onHighlightChange,
    }
  }, [virtualized, itemsProp, onHighlightChange])

  return {
    store,
    focusOwnerStore,
    openChainStore,
    registerSurface,
    closeAll,
    virtualization,
    handleOpenChange,
  }
}
