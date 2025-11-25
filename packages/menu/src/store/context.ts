import * as React from 'react'
import { type StoreApi, useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { Menu, Node, RootMenuDef } from '../types.js'
import * as selectors from './selectors.js'
import type {
  BaseMenuStore,
  MenuDefLike,
  MenuLike,
  MenuSurfaceSlice,
  NodeLike,
} from './types.js'

/**
 * Creates a typed React context and hooks for a specific store type.
 * Each consumer package calls this with their store type to get fully typed hooks.
 *
 * @typeParam TData - Data type for menu items
 * @typeParam TMenuDef - Menu definition type
 * @typeParam TMenu - Runtime menu type
 * @typeParam TNode - Runtime node type
 * @typeParam TStore - Complete store type (base + extensions)
 *
 * @example
 * ```ts
 * // In popup-menu package
 * const {
 *   Provider,
 *   useStoreApi,
 *   useOpen,
 *   useDisplayNodes,
 *   // ... other hooks
 * } = createMenuStoreContext<
 *   unknown,
 *   PopupMenuDef<unknown>,
 *   PopupMenu<unknown>,
 *   PopupNode<unknown>,
 *   PopupMenuStore<unknown>
 * >()
 * ```
 */
export function createMenuStoreContext<
  TData,
  TMenuDef extends MenuDefLike,
  TMenu extends MenuLike,
  TNode extends NodeLike,
  TStore extends BaseMenuStore<TData, TMenuDef, TMenu, TNode>,
>() {
  type Surface = MenuSurfaceSlice<TData, TMenuDef, TMenu, TNode>

  const StoreContext = React.createContext<StoreApi<TStore> | null>(null)

  /**
   * Get the raw store API for advanced usage.
   * @throws If used outside provider
   */
  function useStoreApi(): StoreApi<TStore> {
    const store = React.useContext(StoreContext)
    if (!store) {
      throw new Error('useStoreApi must be used within MenuStoreProvider')
    }
    return store
  }

  // ═══════════════════════════════════════════════════════════════
  // Root Hooks
  // ═══════════════════════════════════════════════════════════════

  /** Hook to select menu open state */
  function useOpen(): boolean {
    const store = useStoreApi()
    return useStore(store, selectors.selectOpen)
  }

  /** Hook to select menu disabled state */
  function useDisabled(): boolean {
    const store = useStoreApi()
    return useStore(store, selectors.selectDisabled)
  }

  /** Hook to select scope ID */
  function useScopeId(): string {
    const store = useStoreApi()
    return useStore(store, selectors.selectScopeId)
  }

  /** Hook to select focus owner */
  function useFocusOwner(): string | null {
    const store = useStoreApi()
    return useStore(store, selectors.selectFocusOwner)
  }

  /** Hook to select keyboard config */
  function useKeyboard() {
    const store = useStoreApi()
    return useStore(store, selectors.selectKeyboard)
  }

  /** Hook to select root actions (stable references) */
  function useRootActions() {
    const store = useStoreApi()
    return useStore(
      store,
      useShallow((s) => ({
        setOpen: s.setOpen,
        setDisabled: s.setDisabled,
        closeAllSurfaces: s.closeAllSurfaces,
        setFocusOwner: s.setFocusOwner,
        setKeyboard: s.setKeyboard,
      })),
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // Surface Hooks
  // ═══════════════════════════════════════════════════════════════

  /** Hook to select full surface state */
  function useSurface(surfaceId: string): Surface | undefined {
    const store = useStoreApi()
    return useStore(
      store,
      selectors.selectSurface<TData, TMenuDef, TMenu, TNode>(surfaceId),
    )
  }

  /** Hook to select menu definition */
  function useMenuDef(surfaceId: string): TMenuDef | undefined {
    const store = useStoreApi()
    return useStore(store, selectors.selectMenuDef<TData, TMenuDef>(surfaceId))
  }

  /** Hook to select instantiated menu */
  function useMenu(surfaceId: string): TMenu | null | undefined {
    const store = useStoreApi()
    return useStore(store, selectors.selectMenu<TData, TMenu>(surfaceId))
  }

  /** Hook to select display nodes (render-ready) */
  function useDisplayNodes(surfaceId: string): TNode[] {
    const store = useStoreApi()
    return useStore(
      store,
      selectors.selectDisplayNodes<TData, TNode>(surfaceId),
    )
  }

  /** Hook to select filtered nodes (after search) */
  function useFilteredNodes(surfaceId: string): TNode[] {
    const store = useStoreApi()
    return useStore(
      store,
      selectors.selectFilteredNodes<TData, TNode>(surfaceId),
    )
  }

  /** Hook to select active node */
  function useActiveNode(surfaceId: string): TNode | null {
    const store = useStoreApi()
    return useStore(store, selectors.selectActiveNode<TData, TNode>(surfaceId))
  }

  /** Hook to select surface query */
  function useSurfaceQuery(surfaceId: string): string {
    const store = useStoreApi()
    return useStore(store, selectors.selectSurfaceQuery(surfaceId))
  }

  /** Hook to select surface active ID */
  function useSurfaceActiveId(surfaceId: string): string | null {
    const store = useStoreApi()
    return useStore(store, selectors.selectSurfaceActiveId(surfaceId))
  }

  /** Hook to select surface open state */
  function useSurfaceOpen(surfaceId: string): boolean {
    const store = useStoreApi()
    return useStore(store, selectors.selectSurfaceOpen(surfaceId))
  }

  /** Hook to select loading state */
  function useIsLoading(surfaceId: string): boolean {
    const store = useStoreApi()
    return useStore(store, selectors.selectIsLoading(surfaceId))
  }

  /** Hook to select error state */
  function useError(surfaceId: string): Error | null {
    const store = useStoreApi()
    return useStore(store, selectors.selectError(surfaceId))
  }

  /** Hook to check if surface has results */
  function useHasResults(surfaceId: string): boolean {
    const store = useStoreApi()
    return useStore(store, selectors.selectHasResults(surfaceId))
  }

  /** Hook to check if surface is empty */
  function useIsEmpty(surfaceId: string): boolean {
    const store = useStoreApi()
    return useStore(store, selectors.selectIsEmpty(surfaceId))
  }

  /** Hook to check if surface is focus owner */
  function useIsFocusOwner(surfaceId: string): boolean {
    const store = useStoreApi()
    return useStore(store, selectors.selectIsFocusOwner(surfaceId))
  }

  /** Hook to select surface actions (stable references) */
  function useSurfaceActions(surfaceId: string) {
    const store = useStoreApi()
    return useStore(
      store,
      useShallow((s) => ({
        setOpen: (open: boolean) => s.setSurfaceOpen(surfaceId, open),
        setQuery: (query: string) => s.setSurfaceQuery(surfaceId, query),
        setActiveId: (id: string | null) => s.setSurfaceActiveId(surfaceId, id),
        setInputActive: (active: boolean) =>
          s.setSurfaceInputActive(surfaceId, active),
        setMenu: (menu: TMenu) => s.setSurfaceMenu(surfaceId, menu),
        setFilteredNodes: (nodes: TNode[]) =>
          s.setSurfaceFilteredNodes(surfaceId, nodes),
        setDisplayNodes: (nodes: TNode[]) =>
          s.setSurfaceDisplayNodes(surfaceId, nodes),
        setLoading: (isLoading: boolean) =>
          s.setSurfaceLoading(surfaceId, isLoading),
        setError: (error: Error | null) => s.setSurfaceError(surfaceId, error),
      })),
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // Cross-Surface Hooks
  // ═══════════════════════════════════════════════════════════════

  /** Hook to select all surfaces */
  function useAllSurfaces(): Surface[] {
    const store = useStoreApi()
    return useStore(
      store,
      selectors.selectAllSurfaces<TData, TMenuDef, TMenu, TNode>,
    )
  }

  /** Hook to select root surface */
  function useRootSurface(): Surface | undefined {
    const store = useStoreApi()
    return useStore(
      store,
      selectors.selectRootSurface<TData, TMenuDef, TMenu, TNode>,
    )
  }

  /** Hook to select deepest open surface */
  function useDeepestOpenSurface(): Surface | undefined {
    const store = useStoreApi()
    return useStore(
      store,
      selectors.selectDeepestOpenSurface<TData, TMenuDef, TMenu, TNode>,
    )
  }

  /** Hook to select open surfaces count */
  function useOpenSurfacesCount(): number {
    const store = useStoreApi()
    return useStore(store, selectors.selectOpenSurfacesCount)
  }

  return {
    // Context
    Context: StoreContext,
    Provider: StoreContext.Provider,

    // Store access
    useStoreApi,

    // Root hooks
    useOpen,
    useDisabled,
    useScopeId,
    useFocusOwner,
    useKeyboard,
    useRootActions,

    // Surface hooks
    useSurface,
    useMenuDef,
    useMenu,
    useDisplayNodes,
    useFilteredNodes,
    useActiveNode,
    useSurfaceQuery,
    useSurfaceActiveId,
    useSurfaceOpen,
    useIsLoading,
    useError,
    useHasResults,
    useIsEmpty,
    useIsFocusOwner,
    useSurfaceActions,

    // Cross-surface hooks
    useAllSurfaces,
    useRootSurface,
    useDeepestOpenSurface,
    useOpenSurfacesCount,
  }
}

/**
 * Type helper for extracting the return type of createMenuStoreContext.
 */
export type MenuStoreContextValue<
  TData,
  TMenuDef extends MenuDefLike,
  TMenu extends MenuLike,
  TNode extends NodeLike,
  TStore extends BaseMenuStore<TData, TMenuDef, TMenu, TNode>,
> = ReturnType<
  typeof createMenuStoreContext<TData, TMenuDef, TMenu, TNode, TStore>
>
