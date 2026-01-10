'use client'

import { Popover, type PopoverRootProps } from '@base-ui/react/popover'
import { useStableCallback } from '@base-ui/utils/useStableCallback'
import * as React from 'react'
import { AimGuardProvider } from '../contexts/aim-guard-context.js'
import { FocusOwnerCtx } from '../contexts/focus-owner-context.js'
import { OpenChainCtx } from '../contexts/open-chain-context.js'
import { RootContext } from '../contexts/root-context.js'
import { DropdownMenuStore } from '../store/DropdownMenuStore.js'
import { FocusOwnerStore } from '../store/FocusOwnerStore.js'
import { OpenChainStore } from '../store/OpenChainStore.js'

export interface DropdownMenuRootProps
  extends Omit<PopoverRootProps, 'open' | 'onOpenChange' | 'defaultOpen'> {
  /**
   * Whether the dropdown menu is open.
   * Use for controlled mode.
   */
  open?: boolean

  /**
   * Callback when the open state changes.
   */
  onOpenChange?: (open: boolean) => void

  /**
   * Whether the dropdown menu is initially open.
   * Use for uncontrolled mode.
   * @default false
   */
  defaultOpen?: boolean

  /**
   * Determines if the dropdown menu enters a modal state when open.
   *
   * - `true`: user interaction is limited to the dropdown menu: document page scroll
   *   is locked, and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   * - `'trap-focus'`: focus is trapped inside the dropdown menu, but document page
   *   scroll is not locked and pointer interactions outside of it remain enabled.
   *
   * @default true
   */
  modal?: boolean | 'trap-focus'

  children: React.ReactNode
}

/**
 * Groups all parts of the dropdown menu.
 * Manages open state and provides context to children.
 * Doesn't render its own HTML element.
 */
export function DropdownMenuRoot(props: DropdownMenuRootProps) {
  const {
    open: openProp,
    onOpenChange,
    defaultOpen = false,
    modal = true,
    children,
    ...rest
  } = props

  // Create stable callback for onOpenChange
  const handleOpenChange = useStableCallback((newOpen: boolean) => {
    onOpenChange?.(newOpen)
  })

  // Create the store instance
  const store = DropdownMenuStore.useStore(
    undefined,
    { open: defaultOpen },
    {
      onOpenChange: handleOpenChange,
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

  // Sync controlled open prop to store
  store.useControlledProp('open', openProp, defaultOpen)

  // Get open state from store for Popover
  const open = store.useState('open')

  // Handle Popover's onOpenChange to update the store
  const handlePopoverOpenChange = React.useCallback(
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
  }, [store])

  const contextValue = React.useMemo(
    () => ({
      store,
      depth: 0,
      closeAll,
      registerSurface,
    }),
    [store, closeAll, registerSurface],
  )

  return (
    <RootContext.Provider value={contextValue}>
      <AimGuardProvider>
        <FocusOwnerCtx.Provider value={focusOwnerStore}>
          <OpenChainCtx.Provider value={openChainStore}>
            <Popover.Root
              {...rest}
              open={open}
              onOpenChange={handlePopoverOpenChange}
              modal={modal}
            >
              {children}
            </Popover.Root>
          </OpenChainCtx.Provider>
        </FocusOwnerCtx.Provider>
      </AimGuardProvider>
    </RootContext.Provider>
  )
}

export namespace DropdownMenuRoot {
  export interface Props extends DropdownMenuRootProps {}
  export type ChangeEventDetails = Popover.Root.ChangeEventDetails
  export type Actions = Popover.Root.Actions
}
