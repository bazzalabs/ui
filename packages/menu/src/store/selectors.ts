import type { Menu, Node, RootMenuDef } from '../types.js'
import type {
  BaseMenuStore,
  MenuDefLike,
  MenuLike,
  MenuSurfaceSlice,
  NodeLike,
} from './types.js'

// ─────────────────────────────────────────────────────────────────
// Type Helpers
// ─────────────────────────────────────────────────────────────────

type AnyStore = BaseMenuStore<any, any, any, any>

// ─────────────────────────────────────────────────────────────────
// Root Selectors (non-generic - same for all stores)
// ─────────────────────────────────────────────────────────────────

/** Select whether the menu is open */
export const selectOpen = (state: AnyStore) => state.root.open

/** Select whether the menu is disabled */
export const selectDisabled = (state: AnyStore) => state.root.disabled

/** Select the scope ID */
export const selectScopeId = (state: AnyStore) => state.root.scopeId

/** Select the current focus owner surface ID */
export const selectFocusOwner = (state: AnyStore) => state.focus.ownerId

/** Select text direction */
export const selectDir = (state: AnyStore) => state.keyboard.dir

/** Select vim bindings enabled state */
export const selectVimBindings = (state: AnyStore) => state.keyboard.vimBindings

/** Select full keyboard config */
export const selectKeyboard = (state: AnyStore) => state.keyboard

// ─────────────────────────────────────────────────────────────────
// Surface Selectors (generic)
// ─────────────────────────────────────────────────────────────────

/** Select full surface state */
export function selectSurface<
  TData,
  TMenuDef extends MenuDefLike,
  TMenu extends MenuLike,
  TNode extends NodeLike,
>(surfaceId: string) {
  return (
    state: BaseMenuStore<TData, TMenuDef, TMenu, TNode>,
  ): MenuSurfaceSlice<TData, TMenuDef, TMenu, TNode> | undefined =>
    state.surfaces.get(surfaceId)
}

/** Select menu definition */
export function selectMenuDef<TData, TMenuDef extends MenuDefLike>(
  surfaceId: string,
) {
  return (
    state: BaseMenuStore<TData, TMenuDef, any, any>,
  ): TMenuDef | undefined => state.surfaces.get(surfaceId)?.menuDef
}

/** Select instantiated menu */
export function selectMenu<TData, TMenu extends MenuLike>(surfaceId: string) {
  return (
    state: BaseMenuStore<TData, any, TMenu, any>,
  ): TMenu | null | undefined => state.surfaces.get(surfaceId)?.menu
}

/** Select original nodes from menu definition */
export function selectOriginalNodes<TData>(surfaceId: string) {
  return (state: BaseMenuStore<TData, any, any, any>) =>
    state.surfaces.get(surfaceId)?.menuDef.nodes ?? []
}

/** Select filtered nodes (after search) */
export function selectFilteredNodes<TData, TNode extends NodeLike>(
  surfaceId: string,
) {
  return (state: BaseMenuStore<TData, any, any, TNode>): TNode[] =>
    (state.surfaces.get(surfaceId)?.filteredNodes ?? []) as TNode[]
}

/** Select display nodes (after middleware, render-ready) */
export function selectDisplayNodes<TData, TNode extends NodeLike>(
  surfaceId: string,
) {
  return (state: BaseMenuStore<TData, any, any, TNode>): TNode[] =>
    (state.surfaces.get(surfaceId)?.displayNodes ?? []) as TNode[]
}

// ─────────────────────────────────────────────────────────────────
// Surface Primitive Selectors (non-generic)
// ─────────────────────────────────────────────────────────────────

/** Select surface query string */
export const selectSurfaceQuery = (surfaceId: string) => (state: AnyStore) =>
  state.surfaces.get(surfaceId)?.query ?? ''

/** Select surface active item ID */
export const selectSurfaceActiveId = (surfaceId: string) => (state: AnyStore) =>
  state.surfaces.get(surfaceId)?.activeId ?? null

/** Select whether surface is open */
export const selectSurfaceOpen = (surfaceId: string) => (state: AnyStore) =>
  state.surfaces.get(surfaceId)?.open ?? false

/** Select whether surface input is active */
export const selectSurfaceInputActive =
  (surfaceId: string) => (state: AnyStore) =>
    state.surfaces.get(surfaceId)?.inputActive ?? false

/** Select surface depth */
export const selectSurfaceDepth = (surfaceId: string) => (state: AnyStore) =>
  state.surfaces.get(surfaceId)?.depth ?? 0

/** Select surface parent ID */
export const selectSurfaceParentId = (surfaceId: string) => (state: AnyStore) =>
  state.surfaces.get(surfaceId)?.parentId ?? null

// ─────────────────────────────────────────────────────────────────
// Loading State Selectors
// ─────────────────────────────────────────────────────────────────

/** Select whether surface is loading */
export const selectIsLoading = (surfaceId: string) => (state: AnyStore) =>
  state.surfaces.get(surfaceId)?.isLoading ?? false

/** Select surface error */
export const selectError = (surfaceId: string) => (state: AnyStore) =>
  state.surfaces.get(surfaceId)?.error ?? null

/** Select loading progress */
export const selectLoadingProgress = (surfaceId: string) => (state: AnyStore) =>
  state.surfaces.get(surfaceId)?.loadingProgress ?? null

/** Select whether surface is in streaming mode */
export const selectIsStreaming = (surfaceId: string) => (state: AnyStore) =>
  state.surfaces.get(surfaceId)?.loadingProgress?.mode === 'streaming'

// ─────────────────────────────────────────────────────────────────
// Derived Selectors (generic)
// ─────────────────────────────────────────────────────────────────

/** Select currently active node */
export function selectActiveNode<TData, TNode extends NodeLike>(
  surfaceId: string,
) {
  return (state: BaseMenuStore<TData, any, any, TNode>): TNode | null => {
    const surface = state.surfaces.get(surfaceId)
    if (!surface?.activeId) return null
    return (
      (surface.displayNodes.find((n) => n.id === surface.activeId) as TNode) ??
      null
    )
  }
}

/** Select nodes by kind */
export function selectNodesByKind<
  TData,
  TNode extends NodeLike,
  TKind extends TNode['kind'],
>(surfaceId: string, kind: TKind) {
  return (
    state: BaseMenuStore<TData, any, any, TNode>,
  ): Extract<TNode, { kind: TKind }>[] => {
    const nodes = state.surfaces.get(surfaceId)?.displayNodes ?? []
    return nodes.filter(
      (n): n is Extract<TNode, { kind: TKind }> => n.kind === kind,
    )
  }
}

/** Select item nodes only */
export function selectItemNodes<TData, TNode extends NodeLike>(
  surfaceId: string,
) {
  return selectNodesByKind<TData, TNode, 'item'>(surfaceId, 'item')
}

/** Select submenu nodes only */
export function selectSubmenuNodes<TData, TNode extends NodeLike>(
  surfaceId: string,
) {
  return selectNodesByKind<TData, TNode, 'submenu'>(surfaceId, 'submenu')
}

/** Select whether surface has results */
export const selectHasResults = (surfaceId: string) => (state: AnyStore) =>
  (state.surfaces.get(surfaceId)?.displayNodes.length ?? 0) > 0

/** Select whether surface is empty (no results and not loading) */
export const selectIsEmpty = (surfaceId: string) => (state: AnyStore) => {
  const surface = state.surfaces.get(surfaceId)
  if (!surface) return true
  return surface.displayNodes.length === 0 && !surface.isLoading
}

/** Select whether surface is focus owner */
export const selectIsFocusOwner = (surfaceId: string) => (state: AnyStore) =>
  state.focus.ownerId === surfaceId

// ─────────────────────────────────────────────────────────────────
// Cross-Surface Selectors
// ─────────────────────────────────────────────────────────────────

/** Get all surfaces */
export const selectAllSurfaces = <
  TData,
  TMenuDef extends MenuDefLike,
  TMenu extends MenuLike,
  TNode extends NodeLike,
>(
  state: BaseMenuStore<TData, TMenuDef, TMenu, TNode>,
) => [...state.surfaces.values()]

/** Get surfaces by depth */
export const selectSurfacesByDepth =
  (depth: number) =>
  <
    TData,
    TMenuDef extends MenuDefLike,
    TMenu extends MenuLike,
    TNode extends NodeLike,
  >(
    state: BaseMenuStore<TData, TMenuDef, TMenu, TNode>,
  ) =>
    [...state.surfaces.values()].filter((s) => s.depth === depth)

/** Get root surface (depth 0) */
export const selectRootSurface = <
  TData,
  TMenuDef extends MenuDefLike,
  TMenu extends MenuLike,
  TNode extends NodeLike,
>(
  state: BaseMenuStore<TData, TMenuDef, TMenu, TNode>,
) => [...state.surfaces.values()].find((s) => s.depth === 0)

/** Get child surfaces of a parent */
export const selectChildSurfaces =
  (parentId: string) =>
  <
    TData,
    TMenuDef extends MenuDefLike,
    TMenu extends MenuLike,
    TNode extends NodeLike,
  >(
    state: BaseMenuStore<TData, TMenuDef, TMenu, TNode>,
  ) =>
    [...state.surfaces.values()].filter((s) => s.parentId === parentId)

/** Get open surfaces count */
export const selectOpenSurfacesCount = (state: AnyStore) =>
  [...state.surfaces.values()].filter((s) => s.open).length

/** Get deepest open surface */
export const selectDeepestOpenSurface = <
  TData,
  TMenuDef extends MenuDefLike,
  TMenu extends MenuLike,
  TNode extends NodeLike,
>(
  state: BaseMenuStore<TData, TMenuDef, TMenu, TNode>,
) => {
  const openSurfaces = [...state.surfaces.values()].filter((s) => s.open)
  if (openSurfaces.length === 0) return undefined
  return openSurfaces.reduce((deepest, s) =>
    s.depth > deepest.depth ? s : deepest,
  )
}

// ─────────────────────────────────────────────────────────────────
// Action Selectors (for extracting stable action references)
// ─────────────────────────────────────────────────────────────────

/** Select root actions */
export const selectRootActions = (state: AnyStore) => ({
  setOpen: state.setOpen,
  setDisabled: state.setDisabled,
  closeAllSurfaces: state.closeAllSurfaces,
  setFocusOwner: state.setFocusOwner,
  setKeyboard: state.setKeyboard,
})

/** Select surface actions for a specific surface */
export const selectSurfaceActions =
  <
    TData,
    TMenuDef extends MenuDefLike,
    TMenu extends MenuLike,
    TNode extends NodeLike,
  >(
    surfaceId: string,
  ) =>
  (state: BaseMenuStore<TData, TMenuDef, TMenu, TNode>) => ({
    setOpen: (open: boolean) => state.setSurfaceOpen(surfaceId, open),
    setQuery: (query: string) => state.setSurfaceQuery(surfaceId, query),
    setActiveId: (id: string | null) => state.setSurfaceActiveId(surfaceId, id),
    setInputActive: (active: boolean) =>
      state.setSurfaceInputActive(surfaceId, active),
    setMenu: (menu: TMenu) => state.setSurfaceMenu(surfaceId, menu),
    setFilteredNodes: (nodes: TNode[]) =>
      state.setSurfaceFilteredNodes(surfaceId, nodes),
    setDisplayNodes: (nodes: TNode[]) =>
      state.setSurfaceDisplayNodes(surfaceId, nodes),
    setLoading: (isLoading: boolean) =>
      state.setSurfaceLoading(surfaceId, isLoading),
    setError: (error: Error | null) => state.setSurfaceError(surfaceId, error),
  })
