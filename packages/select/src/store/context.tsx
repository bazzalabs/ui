import * as React from 'react'
import { type StoreApi, useStore } from 'zustand'
import type { SelectMenuStore } from './types.js'

/* ================================================================================================
 * Store Context
 * ============================================================================================== */

const SelectMenuStoreContext = React.createContext<StoreApi<
  SelectMenuStore<any>
> | null>(null)

export interface SelectMenuStoreProviderProps<TData = unknown> {
  store: StoreApi<SelectMenuStore<TData>>
  children: React.ReactNode
}

/**
 * Provider for the select menu store.
 * Wrap your menu tree with this to provide the store to all descendants.
 */
export function SelectMenuStoreProvider<TData = unknown>({
  store,
  children,
}: SelectMenuStoreProviderProps<TData>) {
  return (
    <SelectMenuStoreContext.Provider
      value={store as StoreApi<SelectMenuStore<any>>}
    >
      {children}
    </SelectMenuStoreContext.Provider>
  )
}

/* ================================================================================================
 * Store Hooks
 * ============================================================================================== */

/**
 * Get the raw store API (for advanced use cases).
 * Prefer useSelectMenuStore with a selector for most use cases.
 */
export function useSelectMenuStoreApi<TData = unknown>(): StoreApi<
  SelectMenuStore<TData>
> {
  const store = React.useContext(SelectMenuStoreContext)
  if (!store) {
    throw new Error(
      'useSelectMenuStoreApi must be used within a SelectMenuStoreProvider',
    )
  }
  return store as StoreApi<SelectMenuStore<TData>>
}

/**
 * Subscribe to store state with a selector.
 * Only re-renders when the selected state changes.
 *
 * @example
 * ```tsx
 * // Subscribe to selection state
 * const selection = useSelectMenuStore((state) => state.selection)
 *
 * // Subscribe to open state
 * const open = useSelectMenuStore((state) => state.root.open)
 * ```
 */
export function useSelectMenuStore<TData = unknown, TSelected = unknown>(
  selector: (state: SelectMenuStore<TData>) => TSelected,
): TSelected {
  const store = useSelectMenuStoreApi<TData>()
  return useStore(store, selector)
}

/**
 * Get store actions without subscribing to state changes.
 * Useful when you only need to dispatch actions.
 *
 * @example
 * ```tsx
 * const { setValue, toggleValue } = useSelectMenuActions()
 * ```
 */
export function useSelectMenuActions<TData = unknown>() {
  const store = useSelectMenuStoreApi<TData>()
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

      // Selection (select-specific)
      setValue: state.setValue,
      setValues: state.setValues,
      toggleValue: state.toggleValue,
      isSelected: state.isSelected,
      selectAll: state.selectAll,
      clearAll: state.clearAll,
      isAtMax: state.isAtMax,
      isAtMin: state.isAtMin,
      getSelectionCount: state.getSelectionCount,
    }),
    [state],
  )
}

/* ================================================================================================
 * Convenience Selectors
 * ============================================================================================== */

/** Select root open state */
export const selectOpen = <TData,>(state: SelectMenuStore<TData>) =>
  state.root.open

/** Select root disabled state */
export const selectDisabled = <TData,>(state: SelectMenuStore<TData>) =>
  state.root.disabled

/** Select scope ID */
export const selectScopeId = <TData,>(state: SelectMenuStore<TData>) =>
  state.root.scopeId

/** Select focus owner ID */
export const selectFocusOwnerId = <TData,>(state: SelectMenuStore<TData>) =>
  state.focus.ownerId

/** Select selection state */
export const selectSelection = <TData,>(state: SelectMenuStore<TData>) =>
  state.selection

/** Select single-select value */
export const selectValue = <TData,>(state: SelectMenuStore<TData>) =>
  state.selection.mode === 'single' ? state.selection.value : undefined

/** Select multi-select values */
export const selectValues = <TData,>(state: SelectMenuStore<TData>) =>
  state.selection.mode === 'multi' ? state.selection.values : []

/** Select whether in single or multi mode */
export const selectSelectionMode = <TData,>(state: SelectMenuStore<TData>) =>
  state.selection.mode

/** Create a selector for a specific surface */
export const createSurfaceSelector =
  <TData,>(surfaceId: string) =>
  (state: SelectMenuStore<TData>) =>
    state.surfaces.get(surfaceId)

/** Create a selector for a surface's active ID */
export const createSurfaceActiveIdSelector =
  <TData,>(surfaceId: string) =>
  (state: SelectMenuStore<TData>) =>
    state.surfaces.get(surfaceId)?.activeId ?? null

/** Create a selector for a surface's query */
export const createSurfaceQuerySelector =
  <TData,>(surfaceId: string) =>
  (state: SelectMenuStore<TData>) =>
    state.surfaces.get(surfaceId)?.query ?? ''
