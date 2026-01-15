'use client'

import * as React from 'react'
import type {
  ChangeEventDetails,
  GenericEventDetails,
} from '../../../utils/events/index.js'
import {
  createChangeEventDetails,
  REASONS,
} from '../../../utils/events/index.js'
import { ListboxStore, type VirtualItem } from '../../listbox/index.js'
import type { VirtualizationConfig } from '../contexts/popup-menu-context.js'
import type {
  HighlightChangeReason,
  PopupMenuOpenChangeReason,
} from '../events.js'
import { FocusOwnerStore } from '../store/FocusOwnerStore.js'
import { OpenChainStore } from '../store/OpenChainStore.js'

// ============================================================================
// Types
// ============================================================================

export interface UsePopupMenuRootParams {
  /**
   * Callback when the open state changes.
   * The second parameter contains event details including the reason for the change.
   */
  onOpenChange?: (
    open: boolean,
    eventDetails: ChangeEventDetails<string>,
  ) => void

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
   * The third parameter contains event details including the reason for the change.
   */
  onHighlightChange?: (
    id: string | null,
    index: number,
    eventDetails: GenericEventDetails<string, { index: number }>,
  ) => void
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
  closeAll: (reason?: PopupMenuOpenChangeReason, event?: Event) => void
  /** Virtualization configuration (if enabled) */
  virtualization: VirtualizationConfig | undefined
  /** Handle open state change (updates store and clears stores on close) */
  handleOpenChange: (
    open: boolean,
    reason?: PopupMenuOpenChangeReason,
    event?: Event,
  ) => void
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

  // Track outside pointer events to distinguish outside-press from focus-out
  // When a pointerdown happens outside the menu, we store it so that if a
  // focus-out close happens immediately after, we can treat it as outside-press
  const outsidePointerEventRef = React.useRef<PointerEvent | null>(null)

  // Create stable callback wrapper for onOpenChange that converts focus-out to outside-press
  // when the close was triggered by a pointer event outside the menu
  const stableOnOpenChange = React.useCallback(
    (open: boolean, eventDetails: ChangeEventDetails<string>) => {
      // If closing due to focus-out but we have a stored outside pointer event,
      // convert the reason to outside-press for better cancel() support
      if (
        !open &&
        eventDetails.reason === REASONS.focusOut &&
        outsidePointerEventRef.current
      ) {
        const pointerEvent = outsidePointerEventRef.current
        outsidePointerEventRef.current = null

        // Create new event details with outside-press reason and the pointer event
        const convertedDetails = createChangeEventDetails(
          REASONS.outsidePress,
          pointerEvent,
        )

        onOpenChange?.(open, convertedDetails)

        // If the converted callback canceled, also cancel the original
        if (convertedDetails.isCanceled) {
          eventDetails.cancel()
        }
        return
      }

      // Clear the pointer event ref if we're not using it
      outsidePointerEventRef.current = null

      onOpenChange?.(open, eventDetails)
    },
    [onOpenChange],
  )

  // Create the store instance
  const store = ListboxStore.useStore(
    undefined,
    { open: defaultOpen },
    {
      onOpenChange: stableOnOpenChange,
    },
  )

  // Get current open state for the pointer event listener
  const isOpen = store.useState('open')

  // Listen for pointerdown events on document to detect outside clicks
  // This allows us to convert focus-out to outside-press when appropriate
  React.useEffect(() => {
    if (!isOpen) {
      outsidePointerEventRef.current = null
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      // Store any pointerdown event while the menu is open
      // We'll check if it's truly "outside" when the close event fires
      // by looking at the event target in the user's cancel logic
      outsidePointerEventRef.current = event
    }

    // Use capture phase to see the event before any stopPropagation
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      outsidePointerEventRef.current = null
    }
  }, [isOpen])

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
  const closeAll = React.useCallback(
    (reason: PopupMenuOpenChangeReason = REASONS.itemPress, event?: Event) => {
      // Sort surfaces by depth (deepest first)
      const surfaces = [...surfaceRegistryRef.current.values()].sort(
        (a, b) => b.depth - a.depth,
      )

      // Close each submenu from deepest to shallowest
      for (const surface of surfaces) {
        surface.setOpen(false)
      }

      // Finally close the root
      store.setOpen(false, reason, event)

      // Clear focus ownership and open chain
      focusOwnerStore.clearOwner()
      openChainStore.clear()
    },
    [store, focusOwnerStore, openChainStore],
  )

  // Handle open state change
  const handleOpenChange = React.useCallback(
    (
      newOpen: boolean,
      reason: PopupMenuOpenChangeReason = REASONS.none,
      event?: Event,
    ) => {
      store.setOpen(newOpen, reason, event)
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
