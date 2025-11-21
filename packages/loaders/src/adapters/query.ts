import { type UseQueryOptions, useQuery } from '@tanstack/react-query'
import type { Loader, LoaderContext, LoaderResult } from '../types.js'

/**
 * React Query loader creator function.
 * Creates a loader hook that uses React Query for data fetching.
 *
 * @example
 * ```tsx
 * import { queryLoader } from '@bazza-ui/loaders'
 *
 * const pokemonLoader = queryLoader({
 *   queryKey: ['pokemon'],
 *   queryFn: () => fetchPokemon(),
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
 *   queryKey: ['search', context.query],
 *   queryFn: () => searchItems(context.query),
 *   enabled: !!context.query
 * }))
 * ```
 */
export function queryLoader<TData = any, TTransformed = any>(
  configOrFn:
    | UseQueryOptions<TData, Error, TTransformed>
    | ((ctx: LoaderContext) => UseQueryOptions<TData, Error, TTransformed>),
): Loader<TTransformed> {
  // Return a hook function that follows the Loader interface
  return (context: LoaderContext): LoaderResult<TTransformed> => {
    // Resolve config (can be static or dynamic based on context)
    const cfg =
      typeof configOrFn === 'function' ? configOrFn(context) : configOrFn

    // Build React Query options with loader-specific defaults
    const queryOptions: UseQueryOptions<TData, Error, TTransformed> = {
      ...cfg,
      enabled: cfg.enabled ?? context.isOpen ?? true,
      refetchOnMount: cfg.refetchOnMount ?? false,
      refetchOnWindowFocus: cfg.refetchOnWindowFocus ?? false,
      refetchOnReconnect: cfg.refetchOnReconnect ?? true,
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
