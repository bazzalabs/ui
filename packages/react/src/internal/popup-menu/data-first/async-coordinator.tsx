'use client'

import {
  type LoaderEntry,
  type LoaderTarget,
  loaderTarget,
} from '@bazza-ui/menu-core'
import * as React from 'react'
import type { ListboxStore } from '../../listbox/store/ListboxStore.js'
import { useMaybeStore } from '../hooks/use-maybe-store.js'
import {
  EMPTY_LOADER_SCOPE,
  type LoaderScope,
  type MenuTreeState,
  type MenuTreeStore,
  patch,
  selectLoaders,
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
  /**
   * Replaces the published reveal until the root data list publishes its own
   * again. `settled` only holds results back: the reveal is settled only
   * while the menu's loaders say the root loader has settled too.
   */
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
// Hooks
// ============================================================================

/**
 * The loader scope of the data-first Surface around the caller: provided
 * around the Surface's children only, so the popup's subpage outlet and
 * anything else beside the Surface have none. Its value changes only while
 * its readers are unmounted (a subpage hides the Surface).
 */
export const LoaderScopeContext = React.createContext<LoaderScopeHandle | null>(
  null,
)

const selectSearch = (state: { normalizedSearch: string }) =>
  state.normalizedSearch

/**
 * The coordinator of the nearest data-first Surface around the caller: its
 * loader scope's results in the menu tree, with its search. Every caller in
 * a render gets the same value.
 */
export function useMaybeAsyncMenuCoordinator(): AsyncMenuCoordinatorValue | null {
  const handle = React.useContext(LoaderScopeContext)
  // Subscribed for its search; the value reads it from the store.
  useMaybeStore(handle?.store, selectSearch, '')
  // The value itself is selected, so a change to the scope that publishes
  // nothing new (what a loader is given) doesn't render its readers.
  return useMaybeStore(
    handle?.tree,
    selectCoordinator,
    null,
    handle ?? undefined,
  )
}

const selectCoordinator = (
  state: Pick<MenuTreeState, 'loaders'>,
  handle: LoaderScopeHandle | undefined,
): AsyncMenuCoordinatorValue | null =>
  handle
    ? handle.coordinator(
        selectLoaders(state, handle.id),
        handle.store.state.normalizedSearch,
      )
    : null

export function useAsyncMenuCoordinator(): AsyncMenuCoordinatorValue | null {
  return useMaybeAsyncMenuCoordinator()
}

// ============================================================================
// Loader Scope
// ============================================================================

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

type TreeLoaderEntry = LoaderEntry<
  NodeDef[],
  AsyncLoaderResult<NodeDef[]>,
  AsyncLoaderConfig
>

/**
 * The coordinator's actions, over the scope's loaders in the tree's loader
 * manager. The engine's own loaders report through `useLoaderTarget` and
 * `LoaderScopeHandle.report`; these are for code that calls the published
 * actions itself. `setRootReveal` publishes a reveal, as the root list does.
 */
function loaderActions(handle: LoaderScopeHandle): LoaderActions {
  const register = (
    id: string | null,
    config: AsyncLoaderConfig,
    result: AsyncLoaderResult<NodeDef[]>,
  ) => {
    handle.start(id, config)
    handle.reportCurrent(id, result)
  }
  return {
    registerLoader: (state) => register(state.id, state.config, state.result),
    unregisterLoader: (id) => handle.remove(id),
    updateLoaderResult: (id, result) => handle.reportCurrent(id, result),
    registerRootLoader: (root) => register(null, root.config, root.result),
    unregisterRootLoader: () => handle.remove(null),
    updateRootLoaderResult: (result) => handle.reportCurrent(null, result),
    setRootReveal: (next) => handle.setReveal(next),
  }
}

/**
 * Reports a loader's result as fetching while it answers an earlier query
 * than the search asks (a newer one waits out the debounce, or the loader
 * hasn't reported for it yet): a first load when it shows nothing, a
 * background one when it does.
 */
function asFetching(
  result: AsyncLoaderResult<NodeDef[]>,
): AsyncLoaderResult<NodeDef[]> {
  return {
    ...result,
    fetchStatus: 'fetching',
    isFetching: true,
    isLoading: !result.hasData,
    isInitialLoading: !result.hasData,
    isRefetching: result.hasData,
    loadingPhase: result.hasData ? 'background' : 'initial',
  }
}

// What a loader publishes, kept per result, so a loader whose result and
// config are unchanged keeps its objects through any other change to it (what
// it's given, its state's token).
const fetchingResults = new WeakMap<
  AsyncLoaderResult<NodeDef[]>,
  AsyncLoaderResult<NodeDef[]>
>()
const publishedStates = new WeakMap<
  AsyncLoaderResult<NodeDef[]>,
  AsyncMenuState
>()

/** A loader's state as the coordinator publishes it; none until it reports. */
function publishedState(
  entry: TreeLoaderEntry,
  id: string,
): AsyncMenuState | undefined {
  const { outdated, config } = entry
  let result = entry.result
  if (!result) return undefined
  if (outdated) {
    let fetching = fetchingResults.get(result)
    if (!fetching) {
      fetching = asFetching(result)
      fetchingResults.set(result, fetching)
    }
    result = fetching
  }
  let published = publishedStates.get(result)
  if (!published || published.id !== id || published.config !== config) {
    published = { id, config, result }
    publishedStates.set(result, published)
  }
  return published
}

/** Whether two maps hold the same values by key, in the same order. */
function sameMap<V>(a: Map<string, V>, b: Map<string, V>): boolean {
  if (a.size !== b.size) return false
  const right = b.entries()
  for (const [key, value] of a) {
    const next = right.next().value
    if (!next || next[0] !== key || next[1] !== value) return false
  }
  return true
}

/** Whether two coordinator values publish the same thing. */
function sameCoordinator(
  a: AsyncMenuCoordinatorValue,
  b: AsyncMenuCoordinatorValue,
): boolean {
  return (
    a.searchQuery === b.searchQuery &&
    a.root?.config === b.root?.config &&
    a.root?.result === b.root?.result &&
    a.rootError === b.rootError &&
    a.rootReveal.settled === b.rootReveal.settled &&
    a.rootReveal.settledOnce === b.rootReveal.settledOnce &&
    a.rootReveal.block === b.rootReveal.block &&
    sameMap(a.loaders, b.loaders) &&
    sameMap(a.erroredLoaders, b.erroredLoaders)
  )
}

/** The coordinator value for a loader scope: its loaders and what they add up to. */
function coordinatorValue(
  scope: LoaderScope,
  searchQuery: string,
  actions: LoaderActions,
): AsyncMenuCoordinatorValue {
  const loaders = new Map<string, AsyncMenuState>()
  const erroredLoaders = new Map<string, Error>()
  for (const [id, entry] of scope.loaders.branches) {
    const state = publishedState(entry, id)
    if (!state) continue
    loaders.set(id, state)
    if (entry.error) erroredLoaders.set(id, entry.error)
  }
  const rootEntry = scope.loaders.root
  const rootState = rootEntry && publishedState(rootEntry, '')
  const root: RootAsyncMenuState | null = rootState
    ? { config: rootState.config, result: rootState.result }
    : null
  const rootError = root ? (rootEntry?.error ?? null) : null
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
    // The list's reveal, which it publishes once its rows are, held back at
    // once when the root loader stops being settled (a new search).
    rootReveal: {
      settled: scope.reveal.settled && (rootEntry?.settled ?? true),
      settledOnce: scope.reveal.settledOnce,
      block: scope.reveal.block,
    },
  }
}

/**
 * One data surface's loader scope. Its loaders live in the menu tree's
 * `LoaderManager` (`MenuTreeStore.loaderManager()`), and reach the tree's
 * state with each change; the coordinator value is derived from them, once
 * per change, for every reader.
 */
export class LoaderScopeHandle {
  readonly actions: LoaderActions
  #last: {
    scope: LoaderScope
    searchQuery: string
    value: AsyncMenuCoordinatorValue
  } | null = null

  constructor(
    readonly tree: MenuTreeStore,
    /** The scope's id in the tree. */
    readonly id: string,
    /** The data surface's store, whose search the coordinator reports. */
    readonly store: ListboxStore,
  ) {
    this.actions = loaderActions(this)
  }

  /** A loader (`null`: the surface's own) starts, or its config changed. */
  start(id: string | null, config: AsyncLoaderConfig) {
    this.tree
      .loaderManager()
      .start(this.id, id, config, this.store.state.normalizedSearch)
  }

  /** The loader stopped. */
  remove(id: string | null) {
    this.tree.loaderManager().remove(this.id, id)
  }

  /** The loader's adapter shows `result` for `given`. */
  report(
    id: string | null,
    given: LoaderTarget,
    result: AsyncLoaderResult<NodeDef[]>,
  ) {
    this.tree.loaderManager().report(this.id, id, given, result)
  }

  /** `report`, for what the loader has now. */
  reportCurrent(id: string | null, result: AsyncLoaderResult<NodeDef[]>) {
    const entry = this.tree.loaderManager().get(this.id, id)
    if (entry) this.report(id, entry.given, result)
  }

  /** The loader's adapter stopped reporting. */
  withdraw(id: string | null) {
    this.tree.loaderManager().withdraw(this.id, id)
  }

  /** Publishes the root content's reveal (`LoaderScope.reveal`). */
  setReveal(reveal: RootRevealState) {
    this.tree.updateLoaders(this.id, (scope) =>
      patch(scope, { reveal: patch(scope.reveal, reveal) }),
    )
  }

  coordinator(
    scope: LoaderScope,
    searchQuery: string,
  ): AsyncMenuCoordinatorValue {
    const last = this.#last
    if (last && last.scope === scope && last.searchQuery === searchQuery) {
      return last.value
    }
    const next = coordinatorValue(scope, searchQuery, this.actions)
    // A change that publishes nothing new (what a loader is given, its
    // state's token) keeps the value, so its readers don't render again.
    const value = last && sameCoordinator(last.value, next) ? last.value : next
    this.#last = { scope, searchQuery, value }
    return value
  }
}

let scopeSessions = 0

/**
 * A data-first Surface's loader scope, for `LoaderScopeContext`, while
 * `enabled`: the Surface shows its data-first content. Each stretch it's
 * enabled gets a scope of its own, and the scope is dropped from the tree
 * when it ends (a subpage hides the Surface, or the Surface unmounts), as
 * when the provider unmounted with the Surface's content. Its loaders follow
 * the Surface's search from the store update that changes it, so they and
 * the rows render the same search.
 */
export function useLoaderScope(
  tree: MenuTreeStore,
  store: ListboxStore,
  enabled: boolean,
): LoaderScopeHandle {
  const scopeId = React.useId()
  // biome-ignore lint/correctness/useExhaustiveDependencies(enabled): a new scope for each stretch the Surface is enabled
  const handle = React.useMemo(
    () => new LoaderScopeHandle(tree, `${scopeId}${++scopeSessions}`, store),
    [tree, scopeId, store, enabled],
  )
  React.useLayoutEffect(() => {
    if (!enabled) return undefined
    tree.setLoaderSearch(handle.id, store.state.normalizedSearch)
    const stop = store.observe(selectSearch, (search) =>
      tree.setLoaderSearch(handle.id, search),
    )
    return () => {
      stop()
      tree.dropLoaders(handle.id)
    }
  }, [enabled, tree, handle, store])
  return handle
}

/**
 * What a loader (`null`: the Surface's own `asyncContent`) is given for
 * `search` while it's mounted with `config`. It runs in the loader scope
 * around the caller, which holds a new query back for the config's
 * `debounce`; the first search passes at once.
 */
export function useLoaderTarget(
  id: string | null,
  config: AsyncLoaderConfig | undefined,
  search: string,
): LoaderTarget {
  const handle = React.useContext(LoaderScopeContext)
  const scope = useMaybeStore(
    handle?.tree,
    selectLoaders,
    EMPTY_LOADER_SCOPE,
    handle?.id ?? '',
  )
  const entry =
    id === null ? scope.loaders.root : scope.loaders.branches.get(id)
  const runs = handle !== null && config !== undefined
  React.useLayoutEffect(() => {
    if (handle && config) handle.start(id, config)
  }, [handle, id, config])
  React.useLayoutEffect(() => {
    if (!runs) return undefined
    return () => handle.remove(id)
  }, [handle, id, runs])
  if (entry) return entry.given
  if (!config) return { query: search, enabled: true }
  // Before it starts: what the search asks, as the manager works it out.
  const { query, enabled } = loaderTarget(config, search)
  return { query, enabled }
}
