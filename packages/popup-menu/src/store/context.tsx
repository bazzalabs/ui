import type { Menu, Node, RowRecord, SurfaceRefs } from '@bazza-ui/menu'
import * as React from 'react'
import { type StoreApi, useStore } from 'zustand'
import type { PopupMenuStore } from './types.js'

// Stable empty references to avoid creating new objects on each render
const EMPTY_ARRAY: readonly any[] = []
const EMPTY_MAP: ReadonlyMap<string, any> = new Map()

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

/* ================================================================================================
 * Surface-Specific Hooks
 * ============================================================================================== */

/**
 * Get the active ID for a surface.
 * Re-renders only when activeId changes.
 */
export function useActiveId(surfaceId: string): string | null {
  return usePopupMenuStore(
    React.useCallback(
      (state: PopupMenuStore<any>) =>
        state.surfaces.get(surfaceId)?.activeId ?? null,
      [surfaceId],
    ),
  )
}

/**
 * Get the display nodes for a surface.
 * Re-renders only when displayNodes changes.
 */
export function useDisplayNodes<T = unknown>(surfaceId: string): Node<T>[] {
  return usePopupMenuStore(
    React.useCallback(
      (state: PopupMenuStore<T>) =>
        state.surfaces.get(surfaceId)?.displayNodes ??
        (EMPTY_ARRAY as Node<T>[]),
      [surfaceId],
    ),
  )
}

/**
 * Get the query for a surface.
 * Re-renders only when query changes.
 */
export function useSurfaceQuery(surfaceId: string): string {
  return usePopupMenuStore(
    React.useCallback(
      (state: PopupMenuStore<any>) =>
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
  return usePopupMenuStore(
    React.useCallback(
      (state: PopupMenuStore<any>) =>
        state.surfaces.get(surfaceId)?.inputActive ?? false,
      [surfaceId],
    ),
  )
}

/**
 * Get the menu for a surface.
 * Re-renders only when menu changes.
 */
export function useSurfaceMenu<T = unknown>(surfaceId: string): Menu<T> | null {
  return usePopupMenuStore(
    React.useCallback(
      (state: PopupMenuStore<T>) =>
        (state.surfaces.get(surfaceId)?.menu as Menu<T>) ?? null,
      [surfaceId],
    ),
  )
}

/**
 * Get the refs for a surface.
 * Re-renders when the surface is registered/unregistered.
 */
export function useSurfaceRefs(surfaceId: string): SurfaceRefs | undefined {
  const store = usePopupMenuStoreApi()
  // Subscribe to surface existence so we re-render when surface is registered
  const surfaceExists = usePopupMenuStore(
    React.useCallback(
      (state: PopupMenuStore<any>) => state.surfaces.has(surfaceId),
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
  return usePopupMenuStore(
    React.useCallback(
      (state: PopupMenuStore<any>) =>
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
  return usePopupMenuStore(
    React.useCallback(
      (state: PopupMenuStore<any>) =>
        state.surfaces.get(surfaceId)?.order ?? (EMPTY_ARRAY as string[]),
      [surfaceId],
    ),
  )
}
