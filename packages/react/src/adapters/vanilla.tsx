'use client'

import * as React from 'react'
import type {
  AsyncLoaderResult,
  LoaderComponentProps,
  NodeDef,
  QueryDependentLoaderConfig,
  StaticLoaderConfig,
} from '../internal/popup-menu/deep-search/types.js'

// ============================================================================
// Vanilla Async Adapter (no external dependencies)
// ============================================================================

/**
 * Internal hook for managing async state with plain promises.
 * Use this when you don't have TanStack Query or SWR.
 */
function useAsyncState<T>(
  fetcher: () => Promise<T>,
  options?: { enabled?: boolean },
): AsyncLoaderResult<T> {
  const { enabled = true } = options ?? {}
  const [state, setState] = React.useState<AsyncLoaderResult<T>>({
    data: undefined,
    error: null,
    isLoading: enabled,
    isError: false,
  })

  const fetcherRef = React.useRef(fetcher)
  fetcherRef.current = fetcher

  const refetch = React.useCallback(() => {
    setState((s) => ({ ...s, isLoading: true, error: null, isError: false }))
    fetcherRef
      .current()
      .then((data) => {
        setState({ data, error: null, isLoading: false, isError: false })
      })
      .catch((error) => {
        setState((s) => ({
          ...s,
          error: error instanceof Error ? error : new Error(String(error)),
          isLoading: false,
          isError: true,
        }))
      })
  }, [])

  React.useEffect(() => {
    if (enabled) {
      refetch()
    }
  }, [enabled, refetch])

  return React.useMemo(() => ({ ...state, refetch }), [state, refetch])
}

/**
 * Internal hook for managing query-dependent async state with plain promises.
 * Unlike `useAsyncState`, this hook re-fetches whenever the query changes.
 * Aborts in-flight requests when a new query is issued or the component unmounts.
 */
function useAsyncQueryState(
  fetcher: (
    query: string,
    options?: { signal?: AbortSignal },
  ) => Promise<NodeDef[]>,
  query: string,
  options?: { enabled?: boolean },
): AsyncLoaderResult<NodeDef[]> {
  const { enabled = true } = options ?? {}
  const [state, setState] = React.useState<AsyncLoaderResult<NodeDef[]>>({
    data: undefined,
    error: null,
    isLoading: enabled,
    isError: false,
  })

  const fetcherRef = React.useRef(fetcher)
  fetcherRef.current = fetcher

  React.useEffect(() => {
    if (!enabled) {
      setState({
        data: undefined,
        error: null,
        isLoading: false,
        isError: false,
      })
      return
    }

    const controller = new AbortController()

    setState({ data: undefined, isLoading: true, error: null, isError: false })

    fetcherRef
      .current(query, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ data, error: null, isLoading: false, isError: false })
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setState({
            data: undefined,
            error: error instanceof Error ? error : new Error(String(error)),
            isLoading: false,
            isError: true,
          })
        }
      })

    return () => {
      controller.abort()
    }
  }, [enabled, query])

  const refetch = React.useCallback(() => {
    // Trigger re-run by toggling a state-based effect isn't ideal here,
    // so we do a manual fetch that respects the current query/enabled state.
    setState({ data: undefined, isLoading: true, error: null, isError: false })
    fetcherRef
      .current(query)
      .then((data) => {
        setState({ data, error: null, isLoading: false, isError: false })
      })
      .catch((error) => {
        setState({
          data: undefined,
          error: error instanceof Error ? error : new Error(String(error)),
          isLoading: false,
          isError: true,
        })
      })
  }, [query])

  return React.useMemo(() => ({ ...state, refetch }), [state, refetch])
}

/**
 * Props for creating a static loader with vanilla fetch.
 */
export interface CreateVanillaStaticLoaderProps {
  /**
   * Async function that fetches the menu items.
   */
  fetcher: () => Promise<NodeDef[]>
}

/**
 * Creates a static loader configuration using plain fetch/promises.
 * No external data library required.
 *
 * @example
 * ```tsx
 * const recentFilesLoader = createVanillaStaticLoader({
 *   fetcher: async () => {
 *     const res = await fetch('/api/recent-files')
 *     const data = await res.json()
 *     return data.map(file => ({
 *       kind: 'item',
 *       value: file.name,
 *       render: ...
 *     }))
 *   },
 * })
 * ```
 */
export function createVanillaStaticLoader(
  props: CreateVanillaStaticLoaderProps,
): StaticLoaderConfig {
  const { fetcher } = props

  const Loader: React.FC<LoaderComponentProps> = ({ children }) => {
    const result = useAsyncState(fetcher)
    return <>{children(result)}</>
  }

  return {
    type: 'static',
    Loader,
  }
}

/**
 * Props for creating a query-dependent loader with vanilla fetch.
 */
export interface CreateVanillaQueryLoaderProps {
  /**
   * Async function that fetches menu items based on the search query.
   * Receives an optional `signal` that is aborted when a newer query is issued,
   * allowing you to cancel in-flight requests (e.g. pass it to `fetch()`).
   */
  fetcher: (
    query: string,
    options?: { signal?: AbortSignal },
  ) => Promise<NodeDef[]>
  /**
   * Minimum query length before fetching.
   * @default 1
   */
  minQueryLength?: number
  /**
   * Initial query to pre-fetch on menu open.
   */
  initialQuery?: string
  /**
   * What to show when query is below minQueryLength.
   * @default 'empty'
   */
  belowMinBehavior?: 'empty' | 'placeholder'
  /**
   * Placeholder nodes shown when query is below minQueryLength.
   */
  placeholderNodes?: NodeDef[]
}

/**
 * Creates a query-dependent loader configuration using plain fetch/promises.
 * No external data library required.
 *
 * @example
 * ```tsx
 * const searchLoader = createVanillaQueryLoader({
 *   fetcher: async (query, options) => {
 *     const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
 *       signal: options?.signal, // aborts when a newer query is issued
 *     })
 *     const data = await res.json()
 *     return data.map(item => ({
 *       kind: 'item',
 *       value: item.name,
 *       render: ...
 *     }))
 *   },
 *   minQueryLength: 2,
 * })
 * ```
 */
export function createVanillaQueryLoader(
  props: CreateVanillaQueryLoaderProps,
): QueryDependentLoaderConfig {
  const {
    fetcher,
    minQueryLength = 1,
    initialQuery,
    belowMinBehavior = 'empty',
    placeholderNodes,
  } = props

  const Loader: React.FC<LoaderComponentProps> = ({ query, children }) => {
    const enabled = query.length >= minQueryLength
    const result = useAsyncQueryState(fetcher, query, { enabled })
    return <>{children(result)}</>
  }

  return {
    type: 'query',
    Loader,
    minQueryLength,
    initialQuery,
    belowMinBehavior,
    placeholderNodes,
  }
}
