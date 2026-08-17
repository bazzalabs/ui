'use client'

import * as React from 'react'
import type { ListboxContextValue } from '../../listbox/contexts/listbox-context.js'
import { ListboxContext as ListboxContextProvider } from '../../listbox/contexts/listbox-context.js'
import type { ListboxStore } from '../../listbox/index.js'
import {
  type ComponentName,
  ComponentNameContext,
} from '../contexts/component-name-context.js'
import { FocusOwnerContext } from '../contexts/focus-owner-context.js'
import { FocusZoneRegistryContext } from '../contexts/focus-zone-context.js'
import { OpenChainContext } from '../contexts/open-chain-context.js'
import {
  PopupMenuContext,
  type PopupMenuContextValue,
  type VirtualAnchor,
  type VirtualizationConfig,
} from '../contexts/popup-menu-context.js'
import {
  PopupMenuDebugContext,
  type PopupMenuDebugContextValue,
  type PopupMenuDebugOptions,
  resolvePopupMenuSafeTriangleAreaDebugConfig,
} from '../contexts/popup-menu-debug-context.js'
import { RowIdRegistryContext } from '../contexts/row-id-registry-context.js'
import { createRowIdRegistry } from '../deep-search/row-id-registry.js'
import type {
  GetQualifiedRowIdFn,
  RowIdStrategy,
} from '../deep-search/types.js'
import { AimGuardProvider } from '../hooks/use-aim-guard.js'
import type { FocusOwnerStore } from '../store/FocusOwnerStore.js'
import { FocusZoneRegistry } from '../store/FocusZoneRegistry.js'
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
  /** Whether this menu tree currently ignores user interaction */
  disabled: boolean
  /** Nesting depth: 0 = root menu */
  depth: number
  /** Close the entire menu tree */
  closeAll: () => void
  /**
   * Internal: when true, Surface handles Tab explicitly (close the tree, or
   * cycle through focus zones). Enabled only by DropdownMenu.Root and
   * ContextMenu.Root — never Select or Combobox.
   */
  explicitTabBehavior?: boolean
  /**
   * Internal: what Tab does under `explicitTabBehavior` when the surface (and
   * its ancestors) have no focus-zone tabbables. `'close'` closes the whole
   * tree (dropdown/context-menu). `'inert'` swallows the event, keeping focus
   * where it is (command palette).
   */
  tabWithoutZones?: 'close' | 'inert'
  /** Register a surface for closeAll tracking */
  registerSurface: (
    depth: number,
    setOpen: (open: boolean) => void,
  ) => () => void
  /** Virtualization configuration */
  virtualization?: VirtualizationConfig
  /** Debug visualization flags. */
  debug?: PopupMenuDebugOptions
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
  /**
   * When to close the menu on outside interactions.
   * @default 'pointerdown'
   */
  closeOnOutsidePress?: 'click' | 'pointerdown'
  /**
   * Function to generate qualified unique IDs for rows.
   * Defined once at the root level and applied to all surfaces (root and submenus).
   */
  getQualifiedRowId?: GetQualifiedRowIdFn
  rowIdStrategy?: RowIdStrategy
  /**
   * Component name for generating bazzaui-* slot attributes.
   * E.g., 'dropdown-menu', 'context-menu', 'select', 'combobox'
   */
  componentName: ComponentName
  children: React.ReactNode
}

// ============================================================================
// Component
// ============================================================================

/**
 * Provides all shared context providers for popup menus.
 * Wraps children with:
 * - PopupMenuDebugContext (debug visualization flags)
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
    disabled,
    depth,
    closeAll,
    explicitTabBehavior = false,
    tabWithoutZones = 'close',
    registerSurface,
    virtualization,
    debug,
    virtualAnchor,
    menuType = 'dropdown',
    closeOnOutsidePress = 'pointerdown',
    getQualifiedRowId,
    rowIdStrategy,
    componentName,
    children,
  } = props

  const focusZoneRegistryRef = React.useRef<FocusZoneRegistry | null>(null)
  if (!focusZoneRegistryRef.current) {
    focusZoneRegistryRef.current = new FocusZoneRegistry()
  }

  const rowIdRegistryRef = React.useRef<ReturnType<
    typeof createRowIdRegistry
  > | null>(null)
  if (
    process.env.NODE_ENV !== 'production' &&
    rowIdRegistryRef.current === null
  ) {
    rowIdRegistryRef.current = createRowIdRegistry()
  }

  // PopupMenu context value
  const popupMenuContextValue: PopupMenuContextValue = React.useMemo(
    () => ({
      store,
      disabled,
      depth,
      closeAll,
      explicitTabBehavior,
      tabWithoutZones,
      registerSurface,
      virtualization,
      virtualAnchor,
      menuType,
      closeOnOutsidePress,
      getQualifiedRowId,
      rowIdStrategy,
    }),
    [
      store,
      disabled,
      depth,
      closeAll,
      explicitTabBehavior,
      tabWithoutZones,
      registerSurface,
      virtualization,
      virtualAnchor,
      menuType,
      closeOnOutsidePress,
      getQualifiedRowId,
      rowIdStrategy,
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

  const popupMenuDebugContextValue: PopupMenuDebugContextValue = React.useMemo(
    () => ({
      showSafeTriangleArea: resolvePopupMenuSafeTriangleAreaDebugConfig(
        debug?.showSafeTriangleArea,
        debug?.showSubmenuSafeTriangleArea,
      ),
      logAimGuardEvents: debug?.logAimGuardEvents ?? false,
    }),
    [
      debug?.showSafeTriangleArea,
      debug?.showSubmenuSafeTriangleArea,
      debug?.logAimGuardEvents,
    ],
  )

  return (
    <RowIdRegistryContext.Provider value={rowIdRegistryRef.current}>
      <ComponentNameContext.Provider value={componentName}>
        <PopupMenuDebugContext.Provider value={popupMenuDebugContextValue}>
          <PopupMenuContext.Provider value={popupMenuContextValue}>
            <ListboxContextProvider.Provider value={listboxContextValue}>
              <AimGuardProvider>
                <FocusOwnerContext.Provider value={focusOwnerStore}>
                  <OpenChainContext.Provider value={openChainStore}>
                    <FocusZoneRegistryContext.Provider
                      value={focusZoneRegistryRef.current}
                    >
                      {children}
                    </FocusZoneRegistryContext.Provider>
                  </OpenChainContext.Provider>
                </FocusOwnerContext.Provider>
              </AimGuardProvider>
            </ListboxContextProvider.Provider>
          </PopupMenuContext.Provider>
        </PopupMenuDebugContext.Provider>
      </ComponentNameContext.Provider>
    </RowIdRegistryContext.Provider>
  )
}
