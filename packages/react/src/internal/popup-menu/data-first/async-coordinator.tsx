'use client'

import * as React from 'react'
import { useMenuTree } from '../contexts/menu-tree-context.js'
import {
  type LoaderScope,
  type MenuTreeStore,
  patch,
} from '../store/MenuTreeStore.js'
import type {
  AsyncLoaderConfig,
  AsyncLoaderResult,
  AsyncState,
  NodeDef,
} from './types.js'

// ============================================================================
// Types
// ============================================================================

/**
 * State for a registered async loader.
 */
export interface AsyncMenuState {
  /** Unique identifier for this async menu */
  id: string
  /** The loader configuration */
  config: AsyncLoaderConfig
  /** Current loader result */
  result: AsyncLoaderResult<NodeDef[]>
}

export interface RootAsyncMenuState {
  config: AsyncLoaderConfig
  result: AsyncLoaderResult<NodeDef[]>
}

/**
 * Context value for the async menu coordinator.
 */
export interface AsyncMenuCoordinatorValue {
  // ---- Registration ----
  /** Register a new async loader */
  registerLoader: (state: AsyncMenuState) => void
  /** Unregister an async loader */
  unregisterLoader: (id: string) => void
  /** Update loader result */
  updateLoaderResult: (id: string, result: AsyncLoaderResult<NodeDef[]>) => void
  registerRootLoader: (state: RootAsyncMenuState) => void
  unregisterRootLoader: () => void
  updateRootLoaderResult: (result: AsyncLoaderResult<NodeDef[]>) => void

  // ---- Search Query ----
  /** Current search query from the store */
  searchQuery: string

  // ---- Loader State ----
  /** All registered loaders */
  loaders: Map<string, AsyncMenuState>
  /** The root surface's own `asyncContent` loader; `null` when none is registered. Never present in `loaders`. */
  root: RootAsyncMenuState | null

  // ---- Computed State ----
  /** Any loader is currently in initial loading phase */
  isAnyLoading: boolean
  /** Any loader is currently fetching (initial or background) */
  isAnyFetching: boolean
  /** Any loader is currently in first-load phase */
  isAnyInitialLoading: boolean
  /** Any loader is currently in background refetch phase */
  isAnyRefetching: boolean
  /** All registered loaders are currently in background refetch phase */
  isAllRefetching: boolean
  /** The root loader is currently in initial loading phase */
  isRootLoading: boolean
  /** Static loaders are currently in initial loading phase */
  isStaticLoading: boolean
  /** Static loaders are currently fetching */
  isStaticFetching: boolean
  /** Static loaders in first-load phase */
  isStaticInitialLoading: boolean
  /** Static loaders in background refetch phase */
  isStaticRefetching: boolean
  /** Query loaders are currently in initial loading phase */
  isQueryLoading: boolean
  /** Query loaders are currently fetching */
  isQueryFetching: boolean
  /** Query loaders in first-load phase */
  isQueryInitialLoading: boolean
  /** Query loaders in background refetch phase */
  isQueryRefetching: boolean
  /** All loaders have resolved (not fetching) */
  allResolved: boolean

  // ---- Async Nodes ----
  /** Every loader with a usable result: the root entry (if any) and one branch entry per Resolved ID. */
  getAsyncNodes: () => Array<
    | { kind: 'root'; nodes: NodeDef[] }
    | { kind: 'branch'; id: string; nodes: NodeDef[] }
  >

  // ---- Error Tracking ----
  /** Loaders that errored */
  erroredLoaders: Map<string, Error>
  rootError: Error | null

  // ---- Aggregated State ----
  /** Get the aggregate async state for DataList */
  getAsyncState: () => AsyncState

  // ---- Root content reveal ----
  /**
   * Whether the root surface's `asyncContent` has settled for the current
   * search, published by the root data list. `Empty` waits for it; in
   * `asyncContentReveal: 'block'` mode `Loading` hides once it has settled.
   */
  rootReveal: RootRevealState
  setRootReveal: (state: RootRevealState) => void
}

export interface RootRevealState {
  /** No root loader is pending for the current search. */
  settled: boolean
  /** The root loader has settled at least once since mounting. */
  settledOnce: boolean
  /** The surface uses `asyncContentReveal: 'block'`. */
  block: boolean
}

// ============================================================================
// Context
// ============================================================================

export const AsyncMenuCoordinatorContext =
  React.createContext<AsyncMenuCoordinatorValue | null>(null)

export function useAsyncMenuCoordinator(): AsyncMenuCoordinatorValue | null {
  return React.useContext(AsyncMenuCoordinatorContext)
}

export function useMaybeAsyncMenuCoordinator(): AsyncMenuCoordinatorValue | null {
  return React.useContext(AsyncMenuCoordinatorContext)
}

// ============================================================================
// Provider Props
// ============================================================================

export interface AsyncMenuCoordinatorProviderProps {
  /** Children to render */
  children: React.ReactNode
  /** Current search query from the store */
  searchQuery: string
}

// ============================================================================
// Provider Component
// ============================================================================

/** The id of the data surface's loader scope in its menu tree. */
export const LoaderScopeContext = React.createContext<string | null>(null)

type LoaderActions = Pick<
  AsyncMenuCoordinatorValue,
  | 'registerLoader'
  | 'unregisterLoader'
  | 'updateLoaderResult'
  | 'registerRootLoader'
  | 'unregisterRootLoader'
  | 'updateRootLoaderResult'
  | 'setRootReveal'
>

/** `map` with `id` set to `value` (removed when `undefined`), or `map` itself when that changes nothing. */
function put<V>(map: Map<string, V>, id: string, value: V | undefined) {
  if (map.get(id) === value && (value !== undefined || !map.has(id))) {
    return map
  }
  const next = new Map(map)
  if (value === undefined) next.delete(id)
  else next.set(id, value)
  return next
}

// Same transitions for every loader: set on a real error, cleared only once
// the loader is no longer errored.
function nextError(
  current: Error | null,
  result: AsyncLoaderResult<NodeDef[]>,
) {
  return result.isError ? (result.error ?? current) : null
}

/** Each action is one `updateLoaders` recipe; a no-op returns the scope. */
function loaderActions(tree: MenuTreeStore, scopeId: string): LoaderActions {
  const update = (recipe: (scope: LoaderScope) => LoaderScope) =>
    tree.updateLoaders(scopeId, recipe)
  return {
    registerLoader: (state) =>
      update((scope) =>
        patch(scope, { loaders: put(scope.loaders, state.id, state) }),
      ),
    unregisterLoader: (id) =>
      update((scope) =>
        patch(scope, {
          loaders: put(scope.loaders, id, undefined),
          erroredLoaders: put(scope.erroredLoaders, id, undefined),
        }),
      ),
    updateLoaderResult: (id, result) =>
      update((scope) => {
        const existing = scope.loaders.get(id)
        return patch(scope, {
          loaders: existing
            ? put(scope.loaders, id, { ...existing, result })
            : scope.loaders,
          erroredLoaders: put(
            scope.erroredLoaders,
            id,
            nextError(scope.erroredLoaders.get(id) ?? null, result) ??
              undefined,
          ),
        })
      }),
    registerRootLoader: (root) => update((scope) => patch(scope, { root })),
    unregisterRootLoader: () =>
      update((scope) => patch(scope, { root: null, rootError: null })),
    updateRootLoaderResult: (result) =>
      update((scope) =>
        patch(scope, {
          root: scope.root && { ...scope.root, result },
          rootError: nextError(scope.rootError, result),
        }),
      ),
    setRootReveal: (next) =>
      update((scope) =>
        patch(scope, { rootReveal: patch(scope.rootReveal, next) }),
      ),
  }
}

/** The coordinator value for a loader scope: its loaders and what they add up to. */
function coordinatorValue(
  scope: LoaderScope,
  searchQuery: string,
  actions: LoaderActions,
): AsyncMenuCoordinatorValue {
  const { loaders, root, erroredLoaders, rootError } = scope
  const all = root ? [root, ...loaders.values()] : [...loaders.values()]
  const any = (
    key: 'isLoading' | 'isFetching' | 'isInitialLoading' | 'isRefetching',
    type?: AsyncLoaderConfig['type'],
  ) =>
    all.some(
      (state) => (!type || state.config.type === type) && state.result[key],
    )
  const skippedMenus: AsyncState['skippedMenus'] = rootError
    ? [{ kind: 'root', reason: 'error' }]
    : []
  for (const [id] of erroredLoaders) {
    skippedMenus.push({ kind: 'branch', id, reason: 'error' })
  }
  const asyncState: AsyncState = {
    isLoading: any('isLoading'),
    isFetching: any('isFetching'),
    isInitialLoading: any('isInitialLoading'),
    isRefetching: any('isRefetching'),
    isAllRefetching:
      all.length > 0 && all.every((state) => state.result.isRefetching),
    isStaticLoading: any('isLoading', 'static'),
    isStaticInitialLoading: any('isInitialLoading', 'static'),
    isStaticRefetching: any('isRefetching', 'static'),
    isQueryLoading: any('isLoading', 'query'),
    isQueryInitialLoading: any('isInitialLoading', 'query'),
    isQueryRefetching: any('isRefetching', 'query'),
    skippedMenus,
  }
  return {
    ...actions,
    searchQuery,
    loaders,
    root,
    isAnyLoading: asyncState.isLoading,
    isAnyFetching: asyncState.isFetching,
    isAnyInitialLoading: asyncState.isInitialLoading,
    isAnyRefetching: asyncState.isRefetching,
    isAllRefetching: asyncState.isAllRefetching,
    isRootLoading: root?.result.isLoading ?? false,
    isStaticLoading: asyncState.isStaticLoading,
    isStaticFetching: any('isFetching', 'static'),
    isStaticInitialLoading: asyncState.isStaticInitialLoading,
    isStaticRefetching: asyncState.isStaticRefetching,
    isQueryLoading: asyncState.isQueryLoading,
    isQueryFetching: any('isFetching', 'query'),
    isQueryInitialLoading: asyncState.isQueryInitialLoading,
    isQueryRefetching: asyncState.isQueryRefetching,
    allResolved: !asyncState.isFetching,
    getAsyncNodes: () => [
      ...(root?.result.data && !rootError
        ? [{ kind: 'root' as const, nodes: root.result.data }]
        : []),
      ...[...loaders]
        .filter(([id, state]) => !erroredLoaders.has(id) && state.result.data)
        .map(([id, state]) => ({
          kind: 'branch' as const,
          id,
          nodes: state.result.data!,
        })),
    ],
    erroredLoaders,
    rootError,
    getAsyncState: () => asyncState,
    rootReveal: scope.rootReveal,
  }
}

/**
 * One data surface's loader scope. Its loaders' results live in the menu
 * tree (`MenuTreeStore.updateLoaders`); the coordinator value is derived from
 * them.
 */
export function AsyncMenuCoordinatorProvider(
  props: AsyncMenuCoordinatorProviderProps,
) {
  const { children, searchQuery } = props
  const tree = useMenuTree()
  const scopeId = React.useId()
  const scope = tree.useState('loaders', scopeId)
  React.useLayoutEffect(() => () => tree.dropLoaders(scopeId), [tree, scopeId])

  const actions = React.useMemo(
    () => loaderActions(tree, scopeId),
    [tree, scopeId],
  )
  const contextValue = React.useMemo(
    () => coordinatorValue(scope, searchQuery, actions),
    [scope, searchQuery, actions],
  )

  return (
    <LoaderScopeContext.Provider value={scopeId}>
      <AsyncMenuCoordinatorContext.Provider value={contextValue}>
        {children}
      </AsyncMenuCoordinatorContext.Provider>
    </LoaderScopeContext.Provider>
  )
}
