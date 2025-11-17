import * as React from 'react'
import { instantiateMenuFromDef } from '../primitives/menu-model.js'
import type {
  AggregatedLoaderState,
  AsyncNodeLoaderContext,
  LoaderAdapter,
  Menu,
  MenuDef,
} from '../types.js'
import {
  aggregateLoaderResults,
  collectDeepSearchLoaders,
  type DeepSearchLoaderEntry,
  injectCompletedLoaderResults,
  injectLoaderResults,
  shouldEnableStreaming,
} from '../utils/deep-search.js'

export interface DeepSearchOrchestrationConfig<T> {
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
   * The loader adapter to use for executing async loaders.
   */
  loaderAdapter: LoaderAdapter

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
  filterLoaders?: (entry: DeepSearchLoaderEntry, query: string) => boolean

  /**
   * Optional root loader result to apply to the menu.
   * This will be set as the menu's loader property after deep search injection.
   */
  rootLoaderResult?: any
}

export interface DeepSearchOrchestrationResult<T> {
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
 * @example
 * ```tsx
 * const { menu, aggregatedState, streamingEnabled } = useDeepSearchOrchestration({
 *   menuDef,
 *   query: debouncedQuery,
 *   open: true,
 *   loaderAdapter: NativeLoaderAdapter,
 *   surfaceId: 'my-menu',
 *   filterLoaders: (entry, query) => {
 *     // Only execute loaders if query meets minLength threshold
 *     const threshold = entry.searchConfig?.minLength?.deep ?? 0
 *     return query.length >= threshold
 *   }
 * })
 * ```
 */
export function useDeepSearchOrchestration<T>(
  config: DeepSearchOrchestrationConfig<T>,
): DeepSearchOrchestrationResult<T> {
  const {
    menuDef,
    query,
    open,
    loaderAdapter,
    surfaceId,
    isSubmenu = false,
    filterLoaders,
    rootLoaderResult,
  } = config

  // Collect deep search loaders from the menu tree
  const deepSearchLoaderEntries = React.useMemo(() => {
    if (!query) return []
    return collectDeepSearchLoaders(menuDef)
  }, [menuDef, query])

  // Prepare deep search loader configs for parallel execution
  // Apply optional filtering (e.g., minLength threshold)
  const deepSearchLoaderConfigs = React.useMemo(() => {
    if (deepSearchLoaderEntries.length === 0) return []

    const configs = deepSearchLoaderEntries
      .filter((entry) => {
        // Apply custom filter if provided
        if (filterLoaders) {
          return filterLoaders(entry, query)
        }
        return true
      })
      .map((entry) => ({
        path: entry.path,
        loader: entry.loader,
        context: {
          query,
          open,
        } as AsyncNodeLoaderContext,
      }))

    return configs
  }, [deepSearchLoaderEntries, query, open, filterLoaders])

  // Execute all deep search loaders in parallel using the adapter
  const deepSearchLoaderResults = loaderAdapter.useLoaders(
    deepSearchLoaderConfigs,
  )

  // Aggregate deep search loader states
  const aggregatedState = React.useMemo(() => {
    if (deepSearchLoaderResults.size === 0) return null
    return aggregateLoaderResults(deepSearchLoaderResults, menuDef)
  }, [deepSearchLoaderResults, menuDef])

  // Determine if streaming mode should be enabled
  const streamingEnabled = React.useMemo(() => {
    return shouldEnableStreaming(menuDef)
  }, [menuDef])

  // Track which loaders have been injected for streaming mode
  // This allows us to incrementally inject completed results without re-processing
  const injectedMenuDefRef = React.useRef<MenuDef<T> | null>(null)
  const processedLoadersRef = React.useRef<Set<string>>(new Set())
  const completionOrderRef = React.useRef<string[]>([]) // Track order of completion
  const lastQueryRef = React.useRef<string>('')
  const isInitializedRef = React.useRef<boolean>(false)

  // Reset tracking when query changes
  React.useEffect(() => {
    if (query !== lastQueryRef.current) {
      injectedMenuDefRef.current = null
      processedLoadersRef.current = new Set()
      completionOrderRef.current = []
      lastQueryRef.current = query
      isInitializedRef.current = false
    }
  }, [query])

  // Initialize completion order with static submenus (ones without loaders)
  // This ensures static content maintains stable order while async loaders append as they complete
  React.useEffect(() => {
    if (!isInitializedRef.current && streamingEnabled && query) {
      const loaderPaths = new Set(
        deepSearchLoaderEntries.map((e) => e.path.join('.')),
      )

      // Walk through submenus and add static ones (without loaders) to completion order
      const staticSubmenuIds: string[] = []
      const walkNodes = (nodes: any[] | undefined) => {
        if (!nodes) return
        for (const node of nodes) {
          if (node.kind === 'submenu') {
            const pathKey = node.id
            // If this submenu doesn't have a loader, it's static - add to completion order
            if (!loaderPaths.has(pathKey)) {
              staticSubmenuIds.push(pathKey)
            }
          }
        }
      }

      walkNodes(menuDef.nodes)

      if (staticSubmenuIds.length > 0) {
        // console.log(
        //   '[MENU DEBUG] Initializing completion order with static submenus:',
        //   staticSubmenuIds,
        // )
        completionOrderRef.current = [...staticSubmenuIds]
      }

      isInitializedRef.current = true
    }
  }, [streamingEnabled, query, deepSearchLoaderEntries, menuDef])

  // Build the menu with deep search results injected
  const menu = React.useMemo<Menu<T>>(() => {
    const depth = isSubmenu ? 1 : 0

    // Start with the menu def
    let resolvedMenuDef = { ...menuDef } as MenuDef<T>

    // IMPORTANT: Only inject deep search results in ROOT menus, not in submenus
    // When a submenu is opened, it should use its own loader function with its own query,
    // not the cached deep search results from the parent menu's query
    if (!isSubmenu && aggregatedState && aggregatedState.results.size > 0) {
      if (streamingEnabled) {
        // STREAMING MODE: Incrementally inject only newly completed loaders
        // Build a map of ONLY the new completions (not previously processed)
        const newCompletedResults = new Map<string, any>()

        for (const [pathKey, result] of aggregatedState.results.entries()) {
          if (
            result.data !== undefined &&
            !result.isLoading &&
            !processedLoadersRef.current.has(pathKey)
          ) {
            newCompletedResults.set(pathKey, result)
            processedLoadersRef.current.add(pathKey)
            // Only add to completion order if not already there (it may have been pre-initialized)
            if (!completionOrderRef.current.includes(pathKey)) {
              completionOrderRef.current.push(pathKey)
            }
            // console.log('[MENU DEBUG] Loader completed:', pathKey)
            // console.log(
            //   '[MENU DEBUG] Current completionOrder:',
            //   completionOrderRef.current,
            // )
          }
        }

        // If we have new completions, inject them into the accumulated menu def
        if (newCompletedResults.size > 0) {
          // Start with either the previously injected menu def, or the original
          const baseMenuDef = injectedMenuDefRef.current || resolvedMenuDef

          // Inject the new completions into the base
          resolvedMenuDef = injectCompletedLoaderResults(
            baseMenuDef,
            newCompletedResults,
          )

          // Store the updated menu def for next iteration
          injectedMenuDefRef.current = resolvedMenuDef
        } else if (injectedMenuDefRef.current) {
          // No new completions, but we have previously injected data - use it
          resolvedMenuDef = injectedMenuDefRef.current
        }
      } else {
        // BLOCKING MODE: Wait for all loaders, then inject all at once
        resolvedMenuDef = injectLoaderResults(
          resolvedMenuDef,
          aggregatedState.results,
        )
      }
    }

    // Then apply the root loader result if provided
    if (rootLoaderResult !== undefined) {
      resolvedMenuDef.loader = rootLoaderResult
    }

    // Instantiate the menu
    const instantiatedMenu = instantiateMenuFromDef(
      resolvedMenuDef,
      surfaceId,
      depth,
    )

    // If we have aggregated loading state, merge it with the menu's loading state
    // Only apply this to root menus (submenus should have their own independent loading state)
    if (!isSubmenu && aggregatedState) {
      const loadMode = streamingEnabled
        ? ('streaming' as const)
        : ('blocking' as const)

      return {
        ...instantiatedMenu,
        loadingState: {
          ...instantiatedMenu.loadingState,
          isLoading:
            instantiatedMenu.loadingState?.isLoading ||
            aggregatedState.isLoading,
          isFetching:
            instantiatedMenu.loadingState?.isFetching ||
            aggregatedState.isFetching,
          // Keep isError from main loader only (we fail silently on deep search loaders)
          progress: aggregatedState.progress,
          loadMode,
          completedPaths: aggregatedState.completedPaths,
          inProgressPaths: aggregatedState.inProgressPaths,
          completionOrder: completionOrderRef.current, // Add completion order for stable streaming
        } as any,
      }
    }

    return instantiatedMenu
  }, [
    menuDef,
    surfaceId,
    isSubmenu,
    rootLoaderResult,
    aggregatedState,
    streamingEnabled,
  ])

  return {
    menu,
    aggregatedState,
    streamingEnabled,
    completionOrder: completionOrderRef.current,
  }
}
