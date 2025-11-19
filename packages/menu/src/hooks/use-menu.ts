import * as React from 'react'
import type {
  AggregatedLoaderState,
  Menu,
  MenuDef,
  MenuNodeDefaults,
} from '../types.js'
import {
  type DeepSearchLoaderEntry,
  shouldEnableStreaming,
} from '../utils/deep-search.js'
import { useDeepSearchLoaders } from './use-deep-search-loaders.js'
import { useMenuInstantiation } from './use-menu-instantiation.js'
import { useStreamingState } from './use-streaming-state.js'

export interface UseMenuConfig<T> {
  /**
   * The menu definition to orchestrate deep search for.
   */
  menuDef: MenuDef<T>

  /**
   * The current search query.
   */
  query: string

  /**
   * Whether the menu is currently open.
   */
  open: boolean

  /**
   * Unique identifier for the menu surface.
   */
  surfaceId: string

  /**
   * Whether this is a submenu. If true, deep search injection will be skipped.
   * Submenus should use their own loader function with their own query.
   * @default false
   */
  isSubmenu?: boolean

  /**
   * Optional filter function to determine which loaders should be executed.
   * Useful for implementing minLength thresholds per submenu.
   * Return true to execute the loader, false to skip it.
   */
  filterLoaders?: (entry: DeepSearchLoaderEntry<T>, query: string) => boolean

  /**
   * Optional root loader result to apply to the menu.
   * This will be set as the menu's loader property after deep search injection.
   */
  rootLoaderResult?: any

  /**
   * Pre-computed defaults from factory + instance levels.
   * These will be passed to instantiateMenuFromDef to create the defaults cascade.
   */
  defaults?: MenuNodeDefaults<T>
}

export interface UseMenuResult<T> {
  /**
   * The instantiated menu with deep search results injected and loading state merged.
   */
  menu: Menu<T>

  /**
   * Aggregated state from all deep search loaders, or null if no loaders are active.
   */
  aggregatedState: AggregatedLoaderState | null

  /**
   * Whether streaming mode is enabled for this menu.
   */
  streamingEnabled: boolean

  /**
   * The order in which loaders completed (for stable streaming display).
   */
  completionOrder: string[]
}

/**
 * Centralized hook for orchestrating deep search across nested submenus.
 *
 * This hook handles the complete lifecycle of deep search:
 * 1. Collecting all deep search loaders from the menu tree
 * 2. Filtering loaders based on custom criteria (e.g., minLength)
 * 3. Executing loaders in parallel
 * 4. Aggregating results and tracking streaming state
 * 5. Injecting results back into the menu definition (streaming or blocking)
 * 6. Building the final menu with merged loading state
 *
 * This is a convenience wrapper that composes three focused hooks:
 * - `useDeepSearchLoaders` - Loader collection and execution
 * - `useStreamingState` - Streaming state tracking
 * - `useMenuInstantiation` - Menu instantiation and state merging
 *
 * @param config - Deep search orchestration configuration
 * @returns The instantiated menu with aggregated state and completion order
 *
 * @example
 * ```tsx
 * const { menu, aggregatedState, streamingEnabled } = useMenu({
 *   menuDef,
 *   query: debouncedQuery,
 *   open: true,
 *   surfaceId: 'my-menu',
 *   filterLoaders: (entry, query) => {
 *     // Only execute loaders if query meets minLength threshold
 *     const threshold = entry.searchConfig?.minLength?.deep ?? 0
 *     return query.length >= threshold
 *   }
 * })
 * ```
 */
export function useMenu<T>(config: UseMenuConfig<T>): UseMenuResult<T> {
  const {
    menuDef,
    query,
    open,
    surfaceId,
    isSubmenu = false,
    filterLoaders,
    rootLoaderResult,
    defaults,
  } = config

  // Step 1: Manage loaders - collection, filtering, execution, aggregation
  const { aggregatedState, loaderResults, stableLoaderEntries } =
    useDeepSearchLoaders({
      menuDef,
      query,
      open,
      filterLoaders,
    })

  // Step 2: Determine if streaming mode should be enabled
  const streamingEnabled = React.useMemo(
    () => shouldEnableStreaming(menuDef),
    [menuDef],
  )

  // Step 3: Track streaming state - refs for incremental injection tracking
  const streamingState = useStreamingState({
    menuDef,
    query,
    aggregatedState,
    streamingEnabled,
    stableLoaderEntries,
  })

  // Step 4: Build final menu with injection and state merging
  const { menu } = useMenuInstantiation({
    menuDef,
    surfaceId,
    isSubmenu,
    aggregatedState,
    streamingEnabled,
    streamingState,
    rootLoaderResult,
    defaults,
  })

  return {
    menu,
    aggregatedState,
    streamingEnabled,
    completionOrder: streamingState.completionOrderRef.current,
  }
}
