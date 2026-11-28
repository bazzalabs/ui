'use client'

import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect'
import * as React from 'react'
import type { ListboxContextValue } from '../../listbox/contexts/listbox-context.js'
import { ListboxContext as ListboxContextProvider } from '../../listbox/contexts/listbox-context.js'
import type { ListboxStore } from '../../listbox/index.js'
import { getOpenOwner } from '../../listbox/store/ListboxStore.js'
import type { ComponentName } from '../contexts/component-name-context.js'
import {
  type AimGuardHolder,
  MenuTreeContext,
  MenuTreeTier,
} from '../contexts/menu-tree-context.js'
import {
  PopupMenuContext,
  type PopupMenuContextValue,
  type VirtualAnchor,
  type VirtualizationConfig,
} from '../contexts/popup-menu-context.js'
import {
  defaultPopupMenuDebugContextValue,
  type PopupMenuDebugContextValue,
  type PopupMenuDebugOptions,
  resolvePopupMenuSafeTriangleAreaDebugConfig,
} from '../contexts/popup-menu-debug-context.js'
import {
  type MenuSurfaceSettings,
  SurfaceSettingsContext,
} from '../contexts/surface-settings-context.js'
import {
  MenuSurfaceTier,
  SurfaceTierContext,
  useMaybeMenuSurfaceTier,
} from '../contexts/surface-tier-context.js'
import type { PopupMenuOpenChangeReason } from '../events.js'
import type { MenuTreeResolver } from '../menu-tree/resolver.js'
import type { FocusOwnerStore } from '../store/FocusOwnerStore.js'
import { FocusZoneRegistry } from '../store/FocusZoneRegistry.js'
import { MenuTreeStore } from '../store/MenuTreeStore.js'
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
  /** Close the entire menu tree, for `reason` */
  closeAll: (reason?: PopupMenuOpenChangeReason, event?: Event) => void
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
    setOpen: (
      open: boolean,
      reason?: PopupMenuOpenChangeReason,
      event?: Event,
    ) => void,
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
      elements: rootTree?.elements,
    })
  }, [store, openChainStore, focusOwnerStore, menuTreeResolver])

  // The debug flags are development tools: a production build ignores the
  // `debug` prop, and drops what reads it.
  const debugValue: PopupMenuDebugContextValue = React.useMemo(
    () =>
      process.env.NODE_ENV === 'production'
        ? defaultPopupMenuDebugContextValue
        : {
            showSafeTriangleArea: resolvePopupMenuSafeTriangleAreaDebugConfig(
              debug?.showSafeTriangleArea,
              debug?.showSubmenuSafeTriangleArea,
            ),
            logAimGuardEvents: debug?.logAimGuardEvents ?? false,
          },
    [
      debug?.showSafeTriangleArea,
      debug?.showSubmenuSafeTriangleArea,
      debug?.logAimGuardEvents,
    ],
  )
  // The root's debug flags live in its tree, synced from a layout effect;
  // the tree tier is made with the ones it has then, which parts read until
  // that first sync (`usePopupMenuDebug`).
  tree.useSyncedValue('debug', debugValue)
  const [focusZones] = React.useState(() => new FocusZoneRegistry())
  // The root's aim guard, made by its first submenu trigger. It lives as
  // long as the root: a tier made again (a new tree) shares the guard the
  // mounted triggers hold, and it's disposed only when the root unmounts.
  const [aimGuard] = React.useState<AimGuardHolder>(() => ({
    current: null,
    latest: null,
  }))
  React.useEffect(() => () => aimGuard.current?.dispose(), [aimGuard])
  // biome-ignore lint/correctness/useExhaustiveDependencies(debugValue): it seeds the tier; later values are synced into the tree above
  const treeTier = React.useMemo(
    () =>
      new MenuTreeTier(tree, componentName, debugValue, focusZones, aimGuard),
    [tree, componentName, focusZones, aimGuard],
  )
  useIsoLayoutEffect(() => {
    aimGuard.latest = treeTier
  }, [aimGuard, treeTier])

  // The root level's settings: what the published `PopupMenuContext`
  // carries, but the store and depth, which are the tier's own. Provided
  // with `SurfaceSettingsContext`, memoised on them: its value changes only
  // when one of them does.
  const settings: MenuSurfaceSettings = React.useMemo(
    () => ({
      disabled,
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
      disabled,
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

  // The root surface's tier. A root nested in another menu's content keeps
  // that menu's submenu around it, as its parts read it.
  const outerTier = useMaybeMenuSurfaceTier()
  // The root's `disabled` as last committed, for its submenus' gates
  // (`isLevelDisabled`): written as the render commits, never for a render
  // that doesn't.
  const disabledRef = React.useRef(disabled)
  React.useInsertionEffect(() => {
    disabledRef.current = disabled
  }, [disabled])
  const surfaceTier = React.useMemo(
    () =>
      new MenuSurfaceTier(store, outerTier, depth, {
        isOwnDisabled: () => disabledRef.current,
        isRoot: true,
      }),
    [store, outerTier, depth],
  )

  // PopupMenu context value (published; the engine's parts read the tier)
  const popupMenuContextValue: PopupMenuContextValue = React.useMemo(
    () => ({ store, depth, ...settings }),
    [store, depth, settings],
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
            <SurfaceSettingsContext.Provider value={settings}>
              {children}
            </SurfaceSettingsContext.Provider>
          </SurfaceTierContext.Provider>
        </MenuTreeContext.Provider>
      </ListboxContextProvider.Provider>
    </PopupMenuContext.Provider>
  )
}
