/** biome-ignore-all lint/correctness/useHookAtTopLevel: ignore */

import type {
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query'
import { useQueries, useQuery } from '@tanstack/react-query'
import type {
  AsyncNodeLoader,
  AsyncNodeLoaderContext,
  AsyncNodeLoaderResult,
  LoaderAdapter,
  NodeDef,
} from '../types.js'

/**
 * Checks if a loader is a React Query options object.
 */
function isReactQueryOptions(loader: any): loader is UseQueryOptions {
  return (
    loader &&
    typeof loader === 'object' &&
    ('queryKey' in loader || 'queryFn' in loader)
  )
}

/**
 * React Query adapter for action-menu loaders.
 * Implements the LoaderAdapter interface using React Query hooks.
 *
 * @example Usage with LoaderAdapterProvider
 * ```tsx
 * import { LoaderAdapterProvider } from '@bazzalabs/action-menu'
 * import { ReactQueryLoaderAdapter } from '@bazzalabs/action-menu/react-query'
 *
 * <LoaderAdapterProvider adapter={ReactQueryLoaderAdapter}>
 *   <ActionMenu.Root>
 *     <ActionMenu.Surface menu={menu} />
 *   </ActionMenu.Root>
 * </LoaderAdapterProvider>
 * ```
 *
 * @example Direct usage on Surface
 * ```tsx
 * import { ReactQueryLoaderAdapter } from '@bazzalabs/action-menu/react-query'
 *
 * <ActionMenu.Surface
 *   menu={menu}
 *   loaderAdapter={ReactQueryLoaderAdapter}
 * />
 * ```
 */
export const ReactQueryLoaderAdapter: LoaderAdapter = {
  useLoader<T>(
    loader: AsyncNodeLoader<T> | undefined,
    context: AsyncNodeLoaderContext,
  ): AsyncNodeLoaderResult<T> | undefined {
    // No loader provided
    if (!loader) {
      // We need to call a disabled query to maintain hook order
      useQuery({
        queryKey: ['__disabled__'],
        queryFn: () => Promise.resolve([]),
        enabled: false,
      })
      return undefined
    }

    // Static result (already resolved)
    if (typeof loader === 'object' && 'data' in loader) {
      // Call a disabled query to maintain hook order
      useQuery({
        queryKey: ['__disabled__'],
        queryFn: () => Promise.resolve([]),
        enabled: false,
      })
      return loader as AsyncNodeLoaderResult<T>
    }

    // Function loader that returns a result
    if (typeof loader === 'function') {
      const result = loader(context)

      // If the function returns a static result, use it
      if (result && typeof result === 'object' && 'data' in result) {
        // Call a disabled query to maintain hook order
        useQuery({
          queryKey: ['__disabled__'],
          queryFn: () => Promise.resolve([]),
          enabled: false,
        })
        return result as AsyncNodeLoaderResult<T>
      }

      // If the function returns React Query options, use them
      if (isReactQueryOptions(result)) {
        const queryResult = useQuery({
          refetchOnMount: false,
          ...result,
        } as any) as UseQueryResult<NodeDef<T>[], Error>

        return {
          data: queryResult.data,
          isLoading: queryResult.isLoading,
          error: queryResult.error ?? null,
          isError: queryResult.isError,
          isFetching: queryResult.isFetching,
        }
      }

      // Unknown result type - fall back to disabled query
      useQuery({
        queryKey: ['__disabled__'],
        queryFn: () => Promise.resolve([]),
        enabled: false,
      })
      return undefined
    }

    // React Query options object
    if (isReactQueryOptions(loader)) {
      const queryResult = useQuery({
        refetchOnMount: false,
        ...loader,
      } as any) as UseQueryResult<NodeDef<T>[], Error>

      return {
        data: queryResult.data,
        isLoading: queryResult.isLoading,
        error: queryResult.error ?? null,
        isError: queryResult.isError,
        isFetching: queryResult.isFetching,
      }
    }

    // Unknown loader type - use disabled query
    useQuery({
      queryKey: ['__disabled__'],
      queryFn: () => Promise.resolve([]),
      enabled: false,
    })
    return undefined
  },

  useLoaders<T>(
    loaders: Array<{
      path: string[]
      loader: AsyncNodeLoader<T>
      context: AsyncNodeLoaderContext
    }>,
  ): Map<string, AsyncNodeLoaderResult<T>> {
    // Transform loaders to React Query configs
    const queryConfigs = loaders.map(({ loader, context }) => {
      // If it's a React Query options object, use it directly
      if (isReactQueryOptions(loader)) {
        return {
          refetchOnMount: false,
          ...loader,
        }
      }

      // If it's a function, call it and check the result
      if (typeof loader === 'function') {
        const result = loader(context)
        if (isReactQueryOptions(result)) {
          return {
            refetchOnMount: false,
            ...result,
          }
        }
      }

      // Fall back to disabled query
      return {
        queryKey: ['__disabled__', Math.random()],
        queryFn: () => Promise.resolve([]),
        enabled: false,
      }
    })

    // Execute all queries in parallel
    const results = useQueries({
      queries: queryConfigs as any,
    })

    // Transform results to Map
    const resultMap = new Map<string, AsyncNodeLoaderResult<T>>()
    for (let i = 0; i < loaders.length; i++) {
      const config = loaders[i]
      const result = results[i]
      if (!config || !result) continue

      const pathKey = config.path.join('.')

      resultMap.set(pathKey, {
        data: result.data as NodeDef<T>[] | undefined,
        isLoading: result.isLoading,
        error: (result.error as Error) ?? null,
        isError: result.isError,
        isFetching: result.isFetching,
      })
    }

    return resultMap
  },
}

/**
 * Creates a type-safe async loader for action-menu that integrates with React Query.
 *
 * This helper provides full TypeScript support for React Query options, including
 * autocomplete and type checking for all configuration properties.
 *
 * @typeParam TQueryFnData - The data type returned by queryFn (before select transformation)
 *
 * @param loaderFactory - Function that receives context and returns React Query options
 * @returns A typed loader function compatible with action-menu
 *
 * @example Basic usage
 * ```tsx
 * import { createLoader } from '@bazzalabs/action-menu/react-query'
 *
 * loader: createLoader(({ query }) => ({
 *   queryKey: ['items', query],
 *   queryFn: () => fetchItems(query),
 *   staleTime: 5000,
 *   retry: 3
 * }))
 * ```
 *
 * @example With select transformation
 * ```tsx
 * loader: createLoader<RawData[]>(({ query }) => ({
 *   queryKey: ['items', query],
 *   queryFn: () => fetchRawData(query),
 *   select: (data) => data.map(item => ({
 *     kind: 'item' as const,
 *     id: item.id,
 *     label: item.name
 *   }))
 * }))
 * ```
 *
 * @example With enabled flag based on context
 * ```tsx
 * loader: createLoader(({ query, open }) => ({
 *   queryKey: ['items', query],
 *   queryFn: () => fetchItems(query),
 *   enabled: open && query.length > 0
 * }))
 * ```
 */
export function createLoader<TQueryFnData = NodeDef[]>(
  loaderFactory: (
    context: AsyncNodeLoaderContext,
  ) => UseQueryOptions<TQueryFnData, Error, NodeDef[], QueryKey>,
): (
  context: AsyncNodeLoaderContext,
) => UseQueryOptions<TQueryFnData, Error, NodeDef[], QueryKey> {
  return loaderFactory
}
