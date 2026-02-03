'use client'

import type * as React from 'react'
import type {
  AsyncLoaderResult,
  LoaderComponentProps,
  NodeDef,
  QueryDependentLoaderConfig,
  StaticLoaderConfig,
} from '../internal/popup-menu/deep-search/types.js'

// ============================================================================
// TanStack Query Adapter
// ============================================================================

/**
 * TanStack Query result shape (subset of UseQueryResult).
 * This allows the adapter to work without requiring @tanstack/react-query as a dependency.
 */
export interface TanStackQueryResult<TData, TError = Error> {
  data: TData | undefined
  error: TError | null
  isLoading: boolean
  isError: boolean
  isFetching?: boolean
  refetch: () => void
}

/**
 * Converts a TanStack Query result to an AsyncLoaderResult.
 * Use this to wrap your useQuery hook result.
 *
 * @example
 * ```tsx
 * function MyLoader({ query, children }) {
 *   const result = useQuery({
 *     queryKey: ['items', query],
 *     queryFn: () => fetchItems(query),
 *   })
 *   return children(toAsyncLoaderResult(result))
 * }
 * ```
 */
export function toAsyncLoaderResult<T>(
  result: TanStackQueryResult<T>,
): AsyncLoaderResult<T> {
  return {
    data: result.data,
    error: result.error,
    isLoading: result.isLoading || (result.isFetching ?? false),
    isError: result.isError,
    refetch: result.refetch,
  }
}

/**
 * Props for creating a static loader component.
 */
export interface CreateStaticLoaderProps {
  /**
   * Hook that returns a TanStack Query result.
   * This hook will be called inside the loader component.
   */
  useQuery: () => TanStackQueryResult<NodeDef[]>
}

/**
 * Creates a static loader configuration for use with async menus.
 * The hook is called inside a component, so it follows React's rules of hooks.
 *
 * @example
 * ```tsx
 * const recentFilesLoader = createStaticLoader({
 *   useQuery: () => useQuery({
 *     queryKey: ['recent-files'],
 *     queryFn: fetchRecentFiles,
 *     staleTime: 5 * 60 * 1000,
 *   }),
 * })
 *
 * // Use in submenu
 * {
 *   kind: 'submenu',
 *   value: 'Recent Files',
 *   asyncNodes: {
 *     ...recentFilesLoader,
 *     loadStrategy: 'eager',
 *   },
 *   render: ...
 * }
 * ```
 */
export function createStaticLoader(
  props: CreateStaticLoaderProps,
): StaticLoaderConfig {
  const { useQuery } = props

  const Loader: React.FC<LoaderComponentProps> = ({ children }) => {
    const result = useQuery()
    return <>{children(toAsyncLoaderResult(result))}</>
  }

  return {
    type: 'static',
    Loader,
  }
}

/**
 * Props for creating a query-dependent loader component.
 */
export interface CreateQueryLoaderProps {
  /**
   * Hook that returns a TanStack Query result based on the search query.
   * This hook will be called inside the loader component with the current query.
   */
  useQuery: (query: string) => TanStackQueryResult<NodeDef[]>
  /**
   * Minimum query length before fetching.
   * @default 1
   */
  minQueryLength?: number
  /**
   * Initial query to use when the loader becomes active.
   * Set to '' to fetch all items immediately when the submenu opens.
   * If undefined, waits for user to type before fetching.
   */
  initialQuery?: string
  /**
   * When to trigger the loader:
   * - 'eager': Load when root menu opens (good for deep search)
   * - 'lazy': Load when submenu opens (default)
   * @default 'lazy'
   */
  loadStrategy?: 'eager' | 'lazy'
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
 * Creates a query-dependent loader configuration for use with async menus.
 * The loader will re-fetch when the search query changes.
 *
 * @example
 * ```tsx
 * const searchLoader = createQueryLoader({
 *   useQuery: (query) => useQuery({
 *     queryKey: ['search', query],
 *     queryFn: () => searchItems(query),
 *     enabled: query.length >= 2,
 *   }),
 *   minQueryLength: 2,
 * })
 *
 * // Use in submenu
 * {
 *   kind: 'submenu',
 *   value: 'Search',
 *   asyncNodes: {
 *     ...searchLoader,
 *     includeInDeepSearch: true,
 *   },
 *   render: ...
 * }
 * ```
 */
export function createQueryLoader(
  props: CreateQueryLoaderProps,
): QueryDependentLoaderConfig {
  const {
    useQuery,
    minQueryLength = 1,
    initialQuery,
    loadStrategy,
    belowMinBehavior = 'empty',
    placeholderNodes,
  } = props

  const Loader: React.FC<LoaderComponentProps> = ({ query, children }) => {
    const result = useQuery(query)
    return <>{children(toAsyncLoaderResult(result))}</>
  }

  return {
    type: 'query',
    Loader,
    minQueryLength,
    initialQuery,
    loadStrategy,
    belowMinBehavior,
    placeholderNodes,
  }
}

/**
 * Creates a loader component that wraps a TanStack Query hook.
 * This is a lower-level utility for custom loader implementations.
 *
 * @example
 * ```tsx
 * const MyLoader = createLoaderComponent((query) =>
 *   useQuery({
 *     queryKey: ['items', query],
 *     queryFn: () => fetchItems(query),
 *   })
 * )
 * ```
 */
export function createLoaderComponent(
  useQueryFn: (query: string) => TanStackQueryResult<NodeDef[]>,
): React.FC<LoaderComponentProps> {
  return function TanStackLoader({ query, children }) {
    const result = useQueryFn(query)
    return <>{children(toAsyncLoaderResult(result))}</>
  }
}
