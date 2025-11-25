import useSWR, { type Key, type SWRConfiguration } from 'swr'
import type { Loader, LoaderContext, LoaderResult } from '../types.js'

/**
 * SWR loader configuration that extends SWRConfiguration with required key and fetcher
 */
export type SWRLoaderConfig<TData = any, TError = Error> = SWRConfiguration<
  TData,
  TError
> & {
  /** SWR cache key */
  key: Key
  /** Function to fetch the data */
  fetcher: () => Promise<TData>
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
export function swrLoader<TData = any, TError = Error>(
  configOrFn:
    | SWRLoaderConfig<TData, TError>
    | ((ctx: LoaderContext) => SWRLoaderConfig<TData, TError>),
): Loader<TData> {
  // Return a hook function that follows the Loader interface
  return (context: LoaderContext): LoaderResult<TData> => {
    // Resolve config (can be static or dynamic based on context)
    const cfg =
      typeof configOrFn === 'function' ? configOrFn(context) : configOrFn

    // Extract key and fetcher
    const { key, fetcher, ...swrOptions } = cfg

    // Resolve key if it's a function
    let swrKey = typeof key === 'function' ? key() : key

    // Only fetch when the menu is open (similar to React Query's enabled option)
    // SWR uses null key to disable fetching
    const isOpen = context.isOpen ?? true
    if (!isOpen) {
      swrKey = null
    }

    // Build SWR options with loader-specific defaults
    const options: SWRConfiguration<TData, TError> = {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      errorRetryCount: 3,
      ...swrOptions,
    }

    const result = useSWR<TData, TError>(swrKey, fetcher, options)

    // Return consistent LoaderResult interface
    // Note: SWR's isLoading is true when there's a request in flight and no data yet
    // isValidating is true whenever there's a request (even with existing data)
    return {
      data: result.data,
      isLoading: result.isLoading || (!result.data && result.isValidating),
      isError: !!result.error,
      error: (result.error as Error) ?? null,
    }
  }
}
