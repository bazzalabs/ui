'use client'

import * as React from 'react'
import type { ListboxContextValue } from '../../listbox/contexts/listbox-context.js'
import { ListboxContext as ListboxContextProvider } from '../../listbox/contexts/listbox-context.js'
import type { ListboxStore } from '../../listbox/index.js'
import { getOpenOwner } from '../../listbox/store/ListboxStore.js'
import type { ComponentName } from '../contexts/component-name-context.js'
import {
  MenuTreeContext,
  MenuTreeSettings,
  MenuTreeTier,
} from '../contexts/menu-tree-context.js'
import {
  PopupMenuContext,
  type PopupMenuContextValue,
  type VirtualAnchor,
  type VirtualizationConfig,
} from '../contexts/popup-menu-context.js'
import {
  type PopupMenuDebugContextValue,
  type PopupMenuDebugOptions,
  resolvePopupMenuSafeTriangleAreaDebugConfig,
} from '../contexts/popup-menu-debug-context.js'
import {
  MenuSurfaceTier,
  SurfaceTierContext,
  useMaybeMenuSurfaceTier,
} from '../contexts/surface-tier-context.js'
import type { MenuTreeResolver } from '../menu-tree/resolver.js'
import { AimGuardStore } from '../store/AimGuardStore.js'
import type { FocusOwnerStore } from '../store/FocusOwnerStore.js'
import { FocusZoneRegistry } from '../store/FocusZoneRegistry.js'
import { getElementRegistry, MenuTreeStore } from '../store/MenuTreeStore.js'
import type { OpenChainStore } from '../store/OpenChainStore.js'

// ============================================================================
// Types
// ============================================================================

export interface PopupMenuProvidersProps {
  /** Created by `usePopupMenuRoot`, one per menu root. */
  menuTreeResolver: MenuTreeResolver
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
  /**
   * Internal: DOM focus stays on an element outside the popup for as long as
   * the menu is open, so the root popup neither takes nor returns focus.
   */
  externalFocus?: boolean
  /**
   * Internal: the popup is laid out around an input embedded in it, so Popup
   * and List render `data-input-embedded`.
   */
  inputEmbedded?: boolean
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
   * Whether shift-click and Shift+Enter perform range selection on checkbox items.
   * @default true
   */
  rangeSelection?: boolean
  /**
   * Whether pressing a checkbox item and dragging performs drag selection, and
   * how rows the pointer moves back over are treated.
   * @default false
   */
  dragSelection?: false | 'keep' | 'rubber-band'
  /**
   * Text announced to assistive technology after a range or drag selection
   * changes rows. Defaults to English ("3 items checked").
   */
  getAriaSelectionText?: (count: number, checked: boolean) => string
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
 * Provides a menu root's tiers and its published contexts:
 * - MenuTreeContext (the tree tier: the root's `MenuTreeStore`, component
 *   name, debug flags, aim guard and focus zones)
 * - SurfaceTierContext (the root surface's tier)
 * - PopupMenuContext and ListboxContextProvider (published; for consumers
 *   and parts that read them)
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
    externalFocus = false,
    inputEmbedded = false,
    registerSurface,
    virtualization,
    debug,
    virtualAnchor,
    menuType = 'dropdown',
    closeOnOutsidePress = 'pointerdown',
    rangeSelection = true,
    dragSelection = false,
    getAriaSelectionText,
    componentName,
    children,
    menuTreeResolver,
  } = props

  // The menu tree around the stores this root passes: the one
  // `usePopupMenuRoot` made when they're its own, else one around the stores
  // given, sharing that root's elements, so the engine uses those instances.
  const tree = React.useMemo(() => {
    const owner = getOpenOwner(store)
    const rootTree = owner instanceof MenuTreeStore ? owner : undefined
    if (
      rootTree?.openChain === openChainStore &&
      rootTree.focusOwner === focusOwnerStore
    ) {
      return rootTree
    }
    return new MenuTreeStore({
      resolver: menuTreeResolver,
      openChain: openChainStore,
      focusOwner: focusOwnerStore,
      elements: rootTree && getElementRegistry(rootTree),
    })
  }, [store, openChainStore, focusOwnerStore, menuTreeResolver])

  const debugValue: PopupMenuDebugContextValue = React.useMemo(
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
  // The tree tier. Its parts live as long as this root does, made with its
  // first props; later debug flags are synced into its settings.
  const [settings] = React.useState(
    () => new MenuTreeSettings({ debug: debugValue }),
  )
  settings.useSyncedValue('debug', debugValue)
  const [aimGuard] = React.useState(
    () => new AimGuardStore(() => settings.state.debug.logAimGuardEvents),
  )
  const [focusZones] = React.useState(() => new FocusZoneRegistry())
  React.useEffect(() => () => aimGuard.dispose(), [aimGuard])
  const treeTier = React.useMemo(
    () => new MenuTreeTier(tree, componentName, settings, aimGuard, focusZones),
    [tree, componentName, settings, aimGuard, focusZones],
  )

  // The root surface's tier. A root nested in another menu's content keeps
  // that menu's submenu around it, as its parts read it.
  const outerTier = useMaybeMenuSurfaceTier()
  const surfaceTier = React.useMemo(
    () => new MenuSurfaceTier(store, outerTier),
    [store, outerTier],
  )

  // PopupMenu context value
  const popupMenuContextValue: PopupMenuContextValue = React.useMemo(
    () => ({
      store,
      disabled,
      depth,
      closeAll,
      explicitTabBehavior,
      tabWithoutZones,
      externalFocus,
      inputEmbedded,
      registerSurface,
      virtualization,
      virtualAnchor,
      menuType,
      closeOnOutsidePress,
      rangeSelection,
      dragSelection,
      getAriaSelectionText,
    }),
    [
      store,
      disabled,
      depth,
      closeAll,
      explicitTabBehavior,
      tabWithoutZones,
      externalFocus,
      inputEmbedded,
      registerSurface,
      virtualization,
      virtualAnchor,
      menuType,
      closeOnOutsidePress,
      rangeSelection,
      dragSelection,
      getAriaSelectionText,
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
        <MenuTreeContext.Provider value={treeTier}>
          <SurfaceTierContext.Provider value={surfaceTier}>
            {children}
          </SurfaceTierContext.Provider>
        </MenuTreeContext.Provider>
      </ListboxContextProvider.Provider>
    </PopupMenuContext.Provider>
  )
}
