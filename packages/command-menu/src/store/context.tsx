import type { Menu, Node, RowRecord, SurfaceRefs } from '@bazza-ui/menu'
import * as React from 'react'
import { type StoreApi, useStore } from 'zustand'
import type { CommandMenu, CommandMenuDef, CommandNode } from '../types.js'
import type { CommandMenuStore } from './types.js'

// Stable empty references to avoid creating new objects on each render
const EMPTY_ARRAY: readonly any[] = []
const EMPTY_MAP: ReadonlyMap<string, any> = new Map()

/* ================================================================================================
 * Store Context
 * ============================================================================================== */

const CommandMenuStoreContext = React.createContext<StoreApi<
  CommandMenuStore<any>
> | null>(null)

export interface CommandMenuStoreProviderProps<TData = unknown> {
  store: StoreApi<CommandMenuStore<TData>>
  children: React.ReactNode
}

/**
 * Provider for the command menu store.
 * Wrap your menu tree with this to provide the store to all descendants.
 */
export function CommandMenuStoreProvider<TData = unknown>({
  store,
  children,
}: CommandMenuStoreProviderProps<TData>) {
  return (
    <CommandMenuStoreContext.Provider
      value={store as StoreApi<CommandMenuStore<any>>}
    >
      {children}
    </CommandMenuStoreContext.Provider>
  )
}

/* ================================================================================================
 * Store Hooks
 * ============================================================================================== */

/**
 * Get the raw store API (for advanced use cases).
 * Prefer useCommandMenuStore with a selector for most use cases.
 */
export function useCommandMenuStoreApi<TData = unknown>(): StoreApi<
  CommandMenuStore<TData>
> {
  const store = React.useContext(CommandMenuStoreContext)
  if (!store) {
    throw new Error(
      'useCommandMenuStoreApi must be used within a CommandMenuStoreProvider',
    )
  }
  return store as StoreApi<CommandMenuStore<TData>>
}

/**
 * Subscribe to store state with a selector.
 * Only re-renders when the selected state changes.
 *
 * @example
 * ```tsx
 * // Subscribe to navigation stack
 * const stack = useCommandMenuStore((state) => state.navigation.stack)
 *
 * // Subscribe to a specific surface's query
 * const query = useCommandMenuStore((state) => {
 *   const surface = state.surfaces.get('root')
 *   return surface?.query ?? ''
 * })
 * ```
 */
export function useCommandMenuStore<TData = unknown, TSelected = unknown>(
  selector: (state: CommandMenuStore<TData>) => TSelected,
): TSelected {
  const store = useCommandMenuStoreApi<TData>()
  return useStore(store, selector)
}

/**
 * Get store actions without subscribing to state changes.
 * Useful when you only need to dispatch actions.
 *
 * @example
 * ```tsx
 * const { pushSubmenu, popSubmenu } = useCommandMenuActions()
 * ```
 */
export function useCommandMenuActions<TData = unknown>() {
  const store = useCommandMenuStoreApi<TData>()

  // Return only actions (functions), not state
  // Use store as dependency since it's stable - actions are bound to store and don't change
  return React.useMemo(() => {
    const state = store.getState()
    return {
      // Root actions
      setOpen: state.setOpen,
      setDisabled: state.setDisabled,
      setKeyboard: state.setKeyboard,

      // Surface lifecycle
      registerSurface: state.registerSurface,
      unregisterSurface: state.unregisterSurface,

      // Surface state
      setSurfaceOpen: state.setSurfaceOpen,
      setSurfaceQuery: state.setSurfaceQuery,
      setSurfaceActiveId: state.setSurfaceActiveId,
      setSurfaceInputActive: state.setSurfaceInputActive,

      // Row registry
      registerRow: state.registerRow,
      unregisterRow: state.unregisterRow,
      resetOrder: state.resetOrder,
      resetVirtualIndexMap: state.resetVirtualIndexMap,

      // Navigation
      first: state.first,
      last: state.last,
      next: state.next,
      prev: state.prev,

      // Refs
      getSurfaceRefs: state.getSurfaceRefs,

      // Node updates
      setSurfaceMenu: state.setSurfaceMenu,
      setSurfaceFilteredNodes: state.setSurfaceFilteredNodes,
      setSurfaceDisplayNodes: state.setSurfaceDisplayNodes,
      updateSurfaceMenuDef: state.updateSurfaceMenuDef,

      // Loading
      setSurfaceLoading: state.setSurfaceLoading,
      setSurfaceError: state.setSurfaceError,
      setSurfaceLoadingProgress: state.setSurfaceLoadingProgress,

      // Focus
      setFocusOwner: state.setFocusOwner,

      // Bulk
      closeAllSurfaces: state.closeAllSurfaces,
      closeSurfacesFromDepth: state.closeSurfacesFromDepth,

      // Navigation (command-menu specific)
      setRootMenuDef: state.setRootMenuDef,
      pushSubmenu: state.pushSubmenu,
      popSubmenu: state.popSubmenu,
      clearNavigationStack: state.clearNavigationStack,

      // UI (command-menu specific)
      setShowBreadcrumbs: state.setShowBreadcrumbs,
    }
  }, [store])
}

/* ================================================================================================
 * Convenience Selectors
 * ============================================================================================== */

/** Select root open state */
export const selectOpen = <TData,>(state: CommandMenuStore<TData>) =>
  state.root.open

/** Select root disabled state */
export const selectDisabled = <TData,>(state: CommandMenuStore<TData>) =>
  state.root.disabled

/** Select scope ID */
export const selectScopeId = <TData,>(state: CommandMenuStore<TData>) =>
  state.root.scopeId

/** Select focus owner ID */
export const selectFocusOwnerId = <TData,>(state: CommandMenuStore<TData>) =>
  state.focus.ownerId

/** Select navigation state */
export const selectNavigation = <TData,>(state: CommandMenuStore<TData>) =>
  state.navigation

/** Select navigation stack */
export const selectNavigationStack = <TData,>(state: CommandMenuStore<TData>) =>
  state.navigation.stack

/** Select whether in a submenu */
export const selectIsInSubmenu = <TData,>(state: CommandMenuStore<TData>) =>
  state.navigation.isInSubmenu

/** Select current menu definition */
export const selectCurrentMenuDef = <TData,>(state: CommandMenuStore<TData>) =>
  state.navigation.currentMenuDef

/** Select whether breadcrumbs should be shown */
export const selectShowBreadcrumbs = <TData,>(state: CommandMenuStore<TData>) =>
  state.ui.showBreadcrumbs

/** Create a selector for a specific surface */
export const createSurfaceSelector =
  <TData,>(surfaceId: string) =>
  (state: CommandMenuStore<TData>) =>
    state.surfaces.get(surfaceId)

/** Create a selector for a surface's active ID */
export const createSurfaceActiveIdSelector =
  <TData,>(surfaceId: string) =>
  (state: CommandMenuStore<TData>) =>
    state.surfaces.get(surfaceId)?.activeId ?? null

/** Create a selector for a surface's query */
export const createSurfaceQuerySelector =
  <TData,>(surfaceId: string) =>
  (state: CommandMenuStore<TData>) =>
    state.surfaces.get(surfaceId)?.query ?? ''

/* ================================================================================================
 * Surface-Specific Hooks
 * ============================================================================================== */

/**
 * Get the active ID for a surface.
 * Re-renders only when activeId changes.
 */
export function useActiveId(surfaceId: string): string | null {
  return useCommandMenuStore(
    React.useCallback(
      (state: CommandMenuStore<any>) =>
        state.surfaces.get(surfaceId)?.activeId ?? null,
      [surfaceId],
    ),
  )
}

/**
 * Get the display nodes for a surface.
 * Re-renders only when displayNodes changes.
 */
export function useDisplayNodes<T = unknown>(
  surfaceId: string,
): CommandNode<T>[] {
  return useCommandMenuStore(
    React.useCallback(
      (state: CommandMenuStore<T>) =>
        state.surfaces.get(surfaceId)?.displayNodes ??
        (EMPTY_ARRAY as CommandNode<T>[]),
      [surfaceId],
    ),
  )
}

/**
 * Get the query for a surface.
 * Re-renders only when query changes.
 */
export function useSurfaceQuery(surfaceId: string): string {
  return useCommandMenuStore(
    React.useCallback(
      (state: CommandMenuStore<any>) =>
        state.surfaces.get(surfaceId)?.query ?? '',
      [surfaceId],
    ),
  )
}

/**
 * Get the inputActive state for a surface.
 * Re-renders only when inputActive changes.
 */
export function useInputActive(surfaceId: string): boolean {
  return useCommandMenuStore(
    React.useCallback(
      (state: CommandMenuStore<any>) =>
        state.surfaces.get(surfaceId)?.inputActive ?? false,
      [surfaceId],
    ),
  )
}

/**
 * Get the menu for a surface.
 * Re-renders only when menu changes.
 */
export function useSurfaceMenu<T = unknown>(
  surfaceId: string,
): CommandMenu<T> | null {
  return useCommandMenuStore(
    React.useCallback(
      (state: CommandMenuStore<T>) =>
        (state.surfaces.get(surfaceId)?.menu as CommandMenu<T>) ?? null,
      [surfaceId],
    ),
  )
}

/**
 * Get the refs for a surface.
 * Re-renders when the surface is registered/unregistered.
 */
export function useSurfaceRefs(surfaceId: string): SurfaceRefs | undefined {
  const store = useCommandMenuStoreApi()
  // Subscribe to surface existence so we re-render when surface is registered
  const surfaceExists = useCommandMenuStore(
    React.useCallback(
      (state: CommandMenuStore<any>) => state.surfaces.has(surfaceId),
      [surfaceId],
    ),
  )
  // Return refs if surface exists
  return surfaceExists ? store.getState().getSurfaceRefs(surfaceId) : undefined
}

/**
 * Get the rows map for a surface.
 * Re-renders when rows change.
 */
export function useSurfaceRows(surfaceId: string): Map<string, RowRecord> {
  return useCommandMenuStore(
    React.useCallback(
      (state: CommandMenuStore<any>) =>
        state.surfaces.get(surfaceId)?.rows ??
        (EMPTY_MAP as Map<string, RowRecord>),
      [surfaceId],
    ),
  )
}

/**
 * Get the order array for a surface.
 * Re-renders when order changes.
 */
export function useSurfaceOrder(surfaceId: string): string[] {
  return useCommandMenuStore(
    React.useCallback(
      (state: CommandMenuStore<any>) =>
        state.surfaces.get(surfaceId)?.order ?? (EMPTY_ARRAY as string[]),
      [surfaceId],
    ),
  )
}
