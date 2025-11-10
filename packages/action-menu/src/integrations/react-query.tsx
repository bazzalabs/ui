import type {
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query'
import { useQueries, useQuery } from '@tanstack/react-query'
import type {
  AsyncNodeLoaderContext,
  AsyncNodeLoaderResult,
  NodeDef,
} from '../types.js'

/**
 * Context provided to the loader factory function.
 */
export type LoaderContext = {
  /** The current search query string (may be undefined if no search input). */
  query?: string
  /** Whether the menu/submenu is currently open (may be undefined). */
  open?: boolean
}

/**
 * Configuration for creating an async loader with React Query.
 * The factory function receives reactive context ({ query, open }) and returns
 * React Query options.
 */
export type LoaderFactory<TQueryFnData = NodeDef[]> = (
  context: LoaderContext,
) => Omit<
  UseQueryOptions<TQueryFnData, Error, NodeDef[], QueryKey>,
  'initialData'
> & { initialData?: (() => undefined) | undefined }

/**
 * Creates an async loader for ActionMenu that integrates with TanStack React Query.
 *
 * This function provides a clean way to create async loaders without violating
 * React's Rules of Hooks. The loader factory receives reactive context (query, open)
 * and returns React Query configuration.
 *
 * @example Basic usage
 * ```tsx
 * import { createLoader } from '@bazza-ui/action-menu/react-query'
 *
 * const menu = {
 *   id: 'root',
 *   nodes: [{
 *     kind: 'submenu',
 *     id: 'fruits',
 *     label: 'Fruits',
 *     loader: createLoader(({ query, open }) => ({
 *       queryKey: ['fruits', query],
 *       queryFn: () => fetchFruits(query ?? ''),
 *       enabled: open, // Only fetch when submenu is open
 *     }))
 *   }]
 * }
 * ```
 *
 * @example With select transformation
 * ```tsx
 * // When using `select`, TQueryFnData represents the raw data type
 * loader: createLoader(({ query }) => ({
 *   queryKey: ['labels', query],
 *   queryFn: () => fetchLabels(query), // Returns Label[]
 *   select: (labels) => labels.map(label => ({
 *     kind: 'item' as const,
 *     id: label.id,
 *     label: label.name,
 *   })), // Transforms to ItemDef[]
 * }))
 * ```
 *
 * @param loaderFactory - Function that receives context and returns React Query options
 * @returns An async loader function compatible with ActionMenu's loader prop
 *
 * @typeParam T - The data type for each node
 * @typeParam TQueryFnData - The data type returned by queryFn (before select transformation)
 */
export function createLoader<TQueryFnData = NodeDef[]>(
  loaderFactory: LoaderFactory<TQueryFnData>,
): ((context: AsyncNodeLoaderContext) => AsyncNodeLoaderResult) & {
  __loaderFactory?: LoaderFactory<TQueryFnData>
} {
  const loader = (context: AsyncNodeLoaderContext): AsyncNodeLoaderResult => {
    // Call the factory with context to get React Query options
    const queryOptions = loaderFactory({
      query: context.query,
      open: context.open,
    })

    // Call useQuery with the options - this is valid because this function
    // is called during render in the Surface component
    // TQueryFnData is the raw data type, NodeDef<T>[] is the selected/transformed type
    const queryResult: UseQueryResult<NodeDef[], Error> = useQuery(queryOptions)

    // Transform React Query result to AsyncNodeLoaderResult
    return {
      data: queryResult.data,
      isLoading: queryResult.isLoading,
      error: queryResult.error,
      isError: queryResult.isError,
      isFetching: queryResult.isFetching,
    }
  }

  // Attach the factory for eager loading support
  loader.__loaderFactory = loaderFactory

  return loader
}

/**
 * Executes multiple query factories in parallel using useQueries.
 * This is used for eager loading of submenus during deep search.
 *
 * @internal
 */
export function useEagerQueries(
  configs: Array<{
    path: string[]
    factory: LoaderFactory<any>
    context: AsyncNodeLoaderContext
  }>,
): Map<string, AsyncNodeLoaderResult> {
  const results = useQueries({
    queries: configs.map((config) =>
      config.factory({
        query: config.context.query,
        open: config.context.open,
      }),
    ),
  })

  // Transform results to Map
  const resultMap = new Map<string, AsyncNodeLoaderResult>()
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i]
    const result = results[i]
    if (!config || !result) continue

    const pathKey = config.path.join('.')

    resultMap.set(pathKey, {
      data: result.data,
      isLoading: result.isLoading,
      error: result.error ?? null,
      isError: result.isError,
      isFetching: result.isFetching,
    })
  }

  return resultMap
}
