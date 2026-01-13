'use client'

import * as React from 'react'
import type { ListboxContextValue } from '../../listbox/contexts/listbox-context.js'
import { ListboxContext as ListboxContextProvider } from '../../listbox/contexts/listbox-context.js'
import type { ListboxStore, VirtualItem } from '../../listbox/index.js'
import { FocusOwnerContext } from '../contexts/focus-owner-context.js'
import { OpenChainContext } from '../contexts/open-chain-context.js'
import {
  PopupMenuContext,
  type PopupMenuContextValue,
  type VirtualAnchor,
  type VirtualizationConfig,
} from '../contexts/popup-menu-context.js'
import { AimGuardProvider } from '../hooks/use-aim-guard.js'
import type { FocusOwnerStore } from '../store/FocusOwnerStore.js'
import type { OpenChainStore } from '../store/OpenChainStore.js'

// ============================================================================
// Types
// ============================================================================

export interface PopupMenuProvidersProps {
  /** The Listbox store instance */
  store: ListboxStore
  /** The FocusOwner store instance */
  focusOwnerStore: FocusOwnerStore
  /** The OpenChain store instance */
  openChainStore: OpenChainStore
  /** Nesting depth: 0 = root menu */
  depth: number
  /** Close the entire menu tree */
  closeAll: () => void
  /** Register a surface for closeAll tracking */
  registerSurface: (
    depth: number,
    setOpen: (open: boolean) => void,
  ) => () => void
  /** Virtualization configuration */
  virtualization?: VirtualizationConfig
  /**
   * Virtual anchor for positioning (used by ContextMenu).
   * DropdownMenu uses Popover's anchor (trigger button) instead.
   */
  virtualAnchor?: VirtualAnchor
  /**
   * Type of menu for positioning logic.
   * @default 'dropdown'
   */
  menuType?: 'dropdown' | 'context'
  children: React.ReactNode
}

// ============================================================================
// Component
// ============================================================================

/**
 * Provides all shared context providers for popup menus.
 * Wraps children with:
 * - PopupMenuContext (menu-specific state)
 * - ListboxContextProvider (for compatibility with listbox components)
 * - AimGuardProvider (for submenu aim detection)
 * - FocusOwnerContext (for focus tracking across submenus)
 * - OpenChainContext (for tracking open submenu chain)
 */
export function PopupMenuProviders(props: PopupMenuProvidersProps) {
  const {
    store,
    focusOwnerStore,
    openChainStore,
    depth,
    closeAll,
    registerSurface,
    virtualization,
    virtualAnchor,
    menuType = 'dropdown',
    children,
  } = props

  // PopupMenu context value
  const popupMenuContextValue: PopupMenuContextValue = React.useMemo(
    () => ({
      store,
      depth,
      closeAll,
      registerSurface,
      virtualization,
      virtualAnchor,
      menuType,
    }),
    [
      store,
      depth,
      closeAll,
      registerSurface,
      virtualization,
      virtualAnchor,
      menuType,
    ],
  )

  // Listbox context value (for compatibility with dropdown-menu components)
  const listboxContextValue: ListboxContextValue = React.useMemo(
    () => ({
      store,
      depth,
      closeAll,
      registerSurface,
      virtualization,
    }),
    [store, depth, closeAll, registerSurface, virtualization],
  )

  return (
    <PopupMenuContext.Provider value={popupMenuContextValue}>
      <ListboxContextProvider.Provider value={listboxContextValue}>
        <AimGuardProvider>
          <FocusOwnerContext.Provider value={focusOwnerStore}>
            <OpenChainContext.Provider value={openChainStore}>
              {children}
            </OpenChainContext.Provider>
          </FocusOwnerContext.Provider>
        </AimGuardProvider>
      </ListboxContextProvider.Provider>
    </PopupMenuContext.Provider>
  )
}
