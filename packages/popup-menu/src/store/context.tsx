import * as React from 'react'
import { useStore, type StoreApi } from 'zustand'
import type { PopupMenuStore } from './types.js'

/* ================================================================================================
 * Store Context
 * ============================================================================================== */

const PopupMenuStoreContext = React.createContext<StoreApi<
  PopupMenuStore<any>
> | null>(null)

export interface PopupMenuStoreProviderProps<TData = unknown> {
  store: StoreApi<PopupMenuStore<TData>>
  children: React.ReactNode
}

/**
 * Provider for the popup menu store.
 * Wrap your menu tree with this to provide the store to all descendants.
 */
export function PopupMenuStoreProvider<TData = unknown>({
  store,
  children,
}: PopupMenuStoreProviderProps<TData>) {
  return (
    <PopupMenuStoreContext.Provider
      value={store as StoreApi<PopupMenuStore<any>>}
    >
      {children}
    </PopupMenuStoreContext.Provider>
  )
}

/* ================================================================================================
 * Store Hooks
 * ============================================================================================== */

/**
 * Get the raw store API (for advanced use cases).
 * Prefer usePopupMenuStore with a selector for most use cases.
 */
export function usePopupMenuStoreApi<TData = unknown>(): StoreApi<
  PopupMenuStore<TData>
> {
  const store = React.useContext(PopupMenuStoreContext)
  if (!store) {
    throw new Error(
      'usePopupMenuStoreApi must be used within a PopupMenuStoreProvider',
    )
  }
  return store as StoreApi<PopupMenuStore<TData>>
}

/**
 * Subscribe to store state with a selector.
 * Only re-renders when the selected state changes.
 *
 * @example
 * ```tsx
 * // Subscribe to root open state
 * const open = usePopupMenuStore((state) => state.root.open)
 *
 * // Subscribe to a specific surface's active ID
 * const activeId = usePopupMenuStore((state) => {
 *   const surface = state.surfaces.get('root')
 *   return surface?.activeId ?? null
 * })
 * ```
 */
export function usePopupMenuStore<TData = unknown, TSelected = unknown>(
  selector: (state: PopupMenuStore<TData>) => TSelected,
): TSelected {
  const store = usePopupMenuStoreApi<TData>()
  return useStore(store, selector)
}

/**
 * Get store actions without subscribing to state changes.
 * Useful when you only need to dispatch actions.
 *
 * @example
 * ```tsx
 * const { setOpen, closeAllSurfaces } = usePopupMenuActions()
 * ```
 */
export function usePopupMenuActions<TData = unknown>() {
  const store = usePopupMenuStoreApi<TData>()
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

      // Hover
      setSurfaceHoveredId: state.setSurfaceHoveredId,
      setSurfaceSuppressHoverOpen: state.setSurfaceSuppressHoverOpen,
      clearSurfaceSuppressHoverOpen: state.clearSurfaceSuppressHoverOpen,

      // Aim guard
      activateAimGuard: state.activateAimGuard,
      clearAimGuard: state.clearAimGuard,
      isAimGuardBlocking: state.isAimGuardBlocking,
    }),
    [state],
  )
}

/* ================================================================================================
 * Convenience Selectors
 * ============================================================================================== */

/** Select root open state */
export const selectOpen = <TData,>(state: PopupMenuStore<TData>) =>
  state.root.open

/** Select root disabled state */
export const selectDisabled = <TData,>(state: PopupMenuStore<TData>) =>
  state.root.disabled

/** Select scope ID */
export const selectScopeId = <TData,>(state: PopupMenuStore<TData>) =>
  state.root.scopeId

/** Select focus owner ID */
export const selectFocusOwnerId = <TData,>(state: PopupMenuStore<TData>) =>
  state.focus.ownerId

/** Select aim guard state */
export const selectAimGuard = <TData,>(state: PopupMenuStore<TData>) =>
  state.aimGuard

/** Create a selector for a specific surface */
export const createSurfaceSelector =
  <TData,>(surfaceId: string) =>
  (state: PopupMenuStore<TData>) =>
    state.surfaces.get(surfaceId)

/** Create a selector for a surface's active ID */
export const createSurfaceActiveIdSelector =
  <TData,>(surfaceId: string) =>
  (state: PopupMenuStore<TData>) =>
    state.surfaces.get(surfaceId)?.activeId ?? null

/** Create a selector for a surface's query */
export const createSurfaceQuerySelector =
  <TData,>(surfaceId: string) =>
  (state: PopupMenuStore<TData>) =>
    state.surfaces.get(surfaceId)?.query ?? ''

/** Create a selector for a surface's hover state */
export const createSurfaceHoverSelector =
  <TData,>(surfaceId: string) =>
  (state: PopupMenuStore<TData>) =>
    state.surfaces.get(surfaceId)?.hover
