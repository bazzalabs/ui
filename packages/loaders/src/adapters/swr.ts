import useSWR, { type SWRConfiguration } from 'swr'
import type { Loader, LoaderContext, LoaderResult } from '../types.js'

/**
 * Configuration for SWR loader
 */
export type SWRConfig<TData = any> = {
  /** SWR cache key */
  key: string | (() => string | null)
  /** Function to fetch the data */
  fetcher: () => Promise<TData>
  /** SWR configuration options */
  revalidateOnFocus?: boolean
  revalidateOnReconnect?: boolean
  refreshInterval?: number
  dedupingInterval?: number
  focusThrottleInterval?: number
  loadingTimeout?: number
  errorRetryInterval?: number
  errorRetryCount?: number
  fallbackData?: TData
  keepPreviousData?: boolean
  suspense?: boolean
}

/**
 * SWR loader creator function.
 * Creates a loader hook that uses SWR for data fetching.
 *
 * @example
 * ```tsx
 * import { swrLoader } from '@bazza-ui/loaders'
 *
 * const userLoader = swrLoader({
 *   key: '/api/user',
 *   fetcher: () => fetchUser(),
 *   revalidateOnFocus: true
 * })
 * ```
 *
 * @example With dynamic key
 * ```tsx
 * const searchLoader = swrLoader((context) => ({
 *   key: context.query ? `/api/search?q=${context.query}` : null,
 *   fetcher: () => searchItems(context.query)
 * }))
 * ```
 */
export function swrLoader<TData = any>(
  configOrFn: SWRConfig<TData> | ((ctx: LoaderContext) => SWRConfig<TData>),
): Loader<TData> {
  // Return a hook function that follows the Loader interface
  return (context: LoaderContext): LoaderResult<TData> => {
    // Resolve config (can be static or dynamic based on context)
    const cfg =
      typeof configOrFn === 'function' ? configOrFn(context) : configOrFn

    // Resolve key if it's a function
    let swrKey = typeof cfg.key === 'function' ? cfg.key() : cfg.key

    // Only fetch when the menu is open (similar to React Query's enabled option)
    // SWR uses null key to disable fetching
    const isOpen = context.isOpen ?? true
    if (!isOpen) {
      swrKey = null
    }

    // Build SWR options
    const swrOptions: SWRConfiguration<TData, Error> = {
      revalidateOnFocus: cfg.revalidateOnFocus ?? false,
      revalidateOnReconnect: cfg.revalidateOnReconnect ?? true,
      refreshInterval: cfg.refreshInterval,
      dedupingInterval: cfg.dedupingInterval ?? 2000,
      focusThrottleInterval: cfg.focusThrottleInterval,
      loadingTimeout: cfg.loadingTimeout,
      errorRetryInterval: cfg.errorRetryInterval,
      errorRetryCount: cfg.errorRetryCount ?? 3,
      fallbackData: cfg.fallbackData,
      keepPreviousData: cfg.keepPreviousData,
      suspense: cfg.suspense,
    }

    const result = useSWR<TData, Error>(swrKey, cfg.fetcher, swrOptions)

    // Return consistent LoaderResult interface
    // Note: SWR's isLoading is true when there's a request in flight and no data yet
    // isValidating is true whenever there's a request (even with existing data)
    return {
      data: result.data,
      isLoading: result.isLoading || (!result.data && result.isValidating),
      isError: !!result.error,
      error: result.error ?? null,
    }
  }
}
