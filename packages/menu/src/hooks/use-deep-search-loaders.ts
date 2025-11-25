import * as React from 'react'
import type {
  AggregatedLoaderState,
  AsyncNodeLoaderContext,
  AsyncNodeLoaderResult,
  MenuDef,
  SubmenuDef,
} from '../types.js'
import {
  aggregateLoaderResults,
  collectDeepSearchLoaders,
  type DeepSearchLoaderEntry,
} from '../utils/deep-search.js'
import { useLoaders } from './use-loader.js'

/**
 * Configuration for useDeepSearchLoaders hook.
 */
export interface UseDeepSearchLoadersConfig<T> {
  /**
   * The menu definition to collect loaders from.
   */
  menuDef: MenuDef<T> | SubmenuDef<T>

  /**
   * The current search query.
   */
  query: string

  /**
   * Whether the menu is currently open.
   */
  open: boolean

  /**
   * Optional filter function to determine which loaders should be executed.
   * Useful for implementing minLength thresholds per submenu.
   * Return true to execute the loader, false to skip it.
   */
  filterLoaders?: (entry: DeepSearchLoaderEntry<T>, query: string) => boolean
}

/**
 * Result from useDeepSearchLoaders hook.
 */
export interface UseDeepSearchLoadersResult<T> {
  /**
   * Aggregated state from all deep search loaders, or null if no loaders are active.
   */
  aggregatedState: AggregatedLoaderState | null

  /**
   * Raw loader results map.
   */
  loaderResults: Map<string, AsyncNodeLoaderResult<T>>

  /**
   * The stable loader entries (locked on first mount).
   */
  stableLoaderEntries: DeepSearchLoaderEntry<T>[]
}

/**
 * Hook for managing collection, filtering, and execution of deep search loaders.
 *
 * This hook handles:
 * 1. Collecting loaders from the menu tree
 * 2. Locking the loader list on first mount (for stable hooks)
 * 3. Filtering loaders based on query and custom filter function
 * 4. Executing loaders in parallel
 * 5. Aggregating results into a single state
 *
 * The loader list is locked on first mount to prevent React hooks order violations
 * when the menu structure changes dynamically.
 *
 * @param config - Configuration for loader management
 * @returns Aggregated loader state, raw results, and stable loader entries
 *
 * @example
 * ```tsx
 * const { aggregatedState, loaderResults } = useDeepSearchLoaders({
 *   menuDef,
 *   query: 'search term',
 *   open: true,
 *   filterLoaders: (entry, query) => {
 *     const threshold = entry.searchConfig?.minLength?.deep ?? 0
 *     return query.length >= threshold
 *   }
 * })
 * ```
 */
export function useDeepSearchLoaders<T>(
  config: UseDeepSearchLoadersConfig<T>,
): UseDeepSearchLoadersResult<T> {
  const { menuDef, query, open, filterLoaders } = config

  // Collect deep search loaders from the menu tree
  // We collect them regardless of query to maintain stable hooks
  const allDeepSearchLoaders = React.useMemo(() => {
    return collectDeepSearchLoaders(menuDef)
  }, [menuDef])

  // Lock the loader list on first mount to ensure stable hooks
  // This prevents hooks order violations when the number of loaders changes
  const lockedLoadersRef = React.useRef<typeof allDeepSearchLoaders | null>(
    null,
  )
  if (!lockedLoadersRef.current && allDeepSearchLoaders.length > 0) {
    lockedLoadersRef.current = allDeepSearchLoaders
  }

  // Use the locked loader list to ensure stable number of hooks
  const stableLoaderEntries = lockedLoadersRef.current || allDeepSearchLoaders

  // Prepare deep search loader configs for parallel execution
  // We pass ALL loaders but mark them as disabled when there's no query or they're filtered out
  const deepSearchLoaderConfigs = React.useMemo(() => {
    if (stableLoaderEntries.length === 0) return []

    const configs = stableLoaderEntries.map((entry) => {
      // Only load if there's a query and not filtered out
      const shouldLoad =
        query && (filterLoaders ? filterLoaders(entry, query) : true)

      return {
        path: entry.path,
        loader: entry.loader,
        context: {
          query: query || '',
          // Mark as closed (disabled) if no query or filtered out
          open: shouldLoad ? open : false,
        } as AsyncNodeLoaderContext,
      }
    })

    return configs
  }, [stableLoaderEntries, query, open, filterLoaders])

  // Execute all deep search loaders in parallel using auto-detection
  const deepSearchLoaderResults = useLoaders(deepSearchLoaderConfigs)

  // Aggregate deep search loader states
  // Filter out results from disabled loaders (where context.open was false)
  const aggregatedState = React.useMemo(() => {
    if (deepSearchLoaderResults.size === 0) return null

    // Filter to only include results from enabled loaders
    const enabledResults = new Map<string, AsyncNodeLoaderResult>()
    const enabledPaths = new Set(
      deepSearchLoaderConfigs
        .filter((config) => config.context.open)
        .map((config) => config.path.join('.')),
    )

    for (const [path, result] of deepSearchLoaderResults.entries()) {
      if (enabledPaths.has(path)) {
        enabledResults.set(path, result as AsyncNodeLoaderResult)
      }
    }

    if (enabledResults.size === 0) return null
    return aggregateLoaderResults(enabledResults, menuDef)
  }, [deepSearchLoaderResults, deepSearchLoaderConfigs, menuDef])

  return {
    aggregatedState,
    loaderResults: deepSearchLoaderResults,
    stableLoaderEntries,
  }
}
