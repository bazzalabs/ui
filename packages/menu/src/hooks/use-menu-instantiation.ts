import * as React from 'react'
import { instantiateMenuFromDef } from '../primitives/menu-model.js'
import type {
  AggregatedLoaderState,
  Menu,
  MenuDef,
  MenuNodeDefaults,
  SubmenuDef,
} from '../types.js'
import {
  injectCompletedLoaderResults,
  injectLoaderResults,
} from '../utils/deep-search.js'
import type { UseStreamingStateResult } from './use-streaming-state.js'

/**
 * Configuration for useMenuInstantiation hook.
 */
export interface UseMenuInstantiationConfig<T> {
  /**
   * The menu definition.
   */
  menuDef: MenuDef<T> | SubmenuDef<T>

  /**
   * Unique identifier for the menu surface.
   */
  surfaceId: string

  /**
   * Whether this is a submenu.
   */
  isSubmenu: boolean

  /**
   * Aggregated state from all deep search loaders.
   */
  aggregatedState: AggregatedLoaderState | null

  /**
   * Whether streaming mode is enabled.
   */
  streamingEnabled: boolean

  /**
   * Streaming state tracking (refs).
   */
  streamingState: UseStreamingStateResult

  /**
   * Optional root loader result to apply to the menu.
   */
  rootLoaderResult?: any

  /**
   * Pre-computed defaults from factory + instance levels.
   */
  defaults?: MenuNodeDefaults<T>
}

/**
 * Result from useMenuInstantiation hook.
 */
export interface UseMenuInstantiationResult<T> {
  /**
   * The final instantiated menu with deep search results injected and loading state merged.
   */
  menu: Menu<T>
}

/**
 * Hook for building the final menu with injected results and merged loading state.
 *
 * This hook handles:
 * 1. Choosing injection strategy (streaming vs blocking)
 * 2. Injecting deep search results into menu definition
 * 3. Applying root loader result
 * 4. Instantiating menu with defaults cascade
 * 5. Merging aggregated loading state
 *
 * In streaming mode, results are injected incrementally as loaders complete.
 * In blocking mode, all results are injected at once after all loaders finish.
 *
 * @param config - Menu configuration
 * @returns The final instantiated menu
 *
 * @example
 * ```tsx
 * const { menu } = useMenuInstantiation({
 *   menuDef,
 *   surfaceId: 'root',
 *   isSubmenu: false,
 *   aggregatedState,
 *   streamingEnabled: true,
 *   streamingState,
 *   rootLoaderResult,
 *   defaults,
 * })
 * ```
 */
export function useMenuInstantiation<T>(
  config: UseMenuInstantiationConfig<T>,
): UseMenuInstantiationResult<T> {
  const {
    menuDef,
    surfaceId,
    isSubmenu,
    aggregatedState,
    streamingEnabled,
    streamingState,
    rootLoaderResult,
    defaults,
  } = config

  const { injectedMenuDefRef, processedLoadersRef, completionOrderRef } =
    streamingState

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

    // Instantiate the menu with defaults cascade
    const instantiatedMenu = instantiateMenuFromDef(
      resolvedMenuDef,
      surfaceId,
      depth,
      defaults,
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
    defaults,
    processedLoadersRef,
    completionOrderRef,
    injectedMenuDefRef,
  ])

  return { menu }
}
