import {
  type QueryKey,
  type UseQueryOptions,
  useQuery,
} from '@tanstack/react-query'
import type { Loader, LoaderContext, LoaderResult } from '../types.js'

/**
 * Configuration for React Query loader
 */
export type QueryConfig<TData = any, TTransformed = any> = {
  /** Query key for caching and refetching */
  key: QueryKey
  /** Function to fetch the data */
  fn: () => Promise<TData>
  /** Transform the data before returning (optional) */
  select?: (data: TData) => TTransformed
  /** Time in ms before data is considered stale */
  staleTime?: number
  /** Whether to retry failed queries */
  retry?: boolean | number
  /** Whether the query is enabled */
  enabled?: boolean
  /** Other React Query options */
  refetchOnMount?: boolean | 'always'
  refetchOnWindowFocus?: boolean | 'always'
  refetchOnReconnect?: boolean | 'always'
  refetchInterval?: number | false
  gcTime?: number
  structuralSharing?: boolean
}

/**
 * React Query loader creator function.
 * Creates a loader hook that uses React Query for data fetching.
 *
 * @example
 * ```tsx
 * import { queryLoader } from '@bazza-ui/loaders'
 *
 * const pokemonLoader = queryLoader({
 *   key: ['pokemon'],
 *   fn: () => fetchPokemon(),
 *   select: (data) => data.results.map(p => ({
 *     kind: 'item',
 *     id: p.name,
 *     label: p.name
 *   })),
 *   staleTime: 60000
 * })
 * ```
 *
 * @example With context
 * ```tsx
 * const searchLoader = queryLoader((context) => ({
 *   key: ['search', context.query],
 *   fn: () => searchItems(context.query),
 *   enabled: !!context.query
 * }))
 * ```
 */
export function queryLoader<TData = any, TTransformed = any>(
  configOrFn:
    | QueryConfig<TData, TTransformed>
    | ((ctx: LoaderContext) => QueryConfig<TData, TTransformed>),
): Loader<TTransformed> {
  // Return a hook function that follows the Loader interface
  return (context: LoaderContext): LoaderResult<TTransformed> => {
    // Resolve config (can be static or dynamic based on context)
    const cfg =
      typeof configOrFn === 'function' ? configOrFn(context) : configOrFn

    // Build React Query options
    const queryOptions: UseQueryOptions<TData, Error, TTransformed> = {
      queryKey: cfg.key,
      queryFn: cfg.fn,
      select: cfg.select,
      staleTime: cfg.staleTime,
      retry: cfg.retry,
      enabled: cfg.enabled ?? context.isOpen ?? true,
      refetchOnMount: cfg.refetchOnMount ?? false,
      refetchOnWindowFocus: cfg.refetchOnWindowFocus ?? false,
      refetchOnReconnect: cfg.refetchOnReconnect ?? true,
      refetchInterval: cfg.refetchInterval,
      gcTime: cfg.gcTime,
      structuralSharing: cfg.structuralSharing,
    }

    const result = useQuery(queryOptions)

    // Return consistent LoaderResult interface
    return {
      data: result.data,
      isLoading: result.isLoading,
      isError: result.isError,
      error: result.error ?? null,
    }
  }
}
