import * as React from 'react'
import { useStore, type StoreApi } from 'zustand'
import type { CommandMenuStore } from './types.js'

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
  const state = store.getState()

  // Return only actions (functions), not state
  return React.useMemo(
    () => ({
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
    }),
    [state],
  )
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
