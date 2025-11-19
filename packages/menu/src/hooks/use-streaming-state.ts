import * as React from 'react'
import type { AggregatedLoaderState, MenuDef } from '../types.js'
import type { DeepSearchLoaderEntry } from '../utils/deep-search.js'

/**
 * Configuration for useStreamingState hook.
 */
export interface UseStreamingStateConfig<T> {
  /**
   * The menu definition.
   */
  menuDef: MenuDef<T>

  /**
   * The current search query.
   */
  query: string

  /**
   * Aggregated state from all deep search loaders.
   */
  aggregatedState: AggregatedLoaderState | null

  /**
   * Whether streaming mode is enabled.
   */
  streamingEnabled: boolean

  /**
   * The stable loader entries.
   */
  stableLoaderEntries: DeepSearchLoaderEntry<T>[]
}

/**
 * Streaming state tracking result.
 */
export interface UseStreamingStateResult {
  /**
   * Ref to the accumulated menu def with injected results (for streaming).
   */
  injectedMenuDefRef: React.MutableRefObject<any | null>

  /**
   * Ref to track which loaders have been processed.
   */
  processedLoadersRef: React.MutableRefObject<Set<string>>

  /**
   * Ref to track completion order.
   */
  completionOrderRef: React.MutableRefObject<string[]>
}

/**
 * Hook for managing streaming state and tracking incremental injection.
 *
 * This hook handles:
 * 1. Resetting state when query changes
 * 2. Initializing completion order with static submenus
 * 3. Tracking which loaders have been processed
 * 4. Maintaining completion order for stable streaming display
 *
 * This hook is responsible for state management only. The actual injection
 * logic is handled by the menu builder.
 *
 * @param config - Streaming state configuration
 * @returns Refs for tracking streaming state
 *
 * @example
 * ```tsx
 * const streamingState = useStreamingState({
 *   menuDef,
 *   query,
 *   aggregatedState,
 *   streamingEnabled: true,
 *   stableLoaderEntries,
 * })
 *
 * // Access streaming state in menu builder
 * if (streamingState.processedLoadersRef.current.has(pathKey)) {
 *   // Already processed
 * }
 * ```
 */
export function useStreamingState<T>(
  config: UseStreamingStateConfig<T>,
): UseStreamingStateResult {
  const {
    menuDef,
    query,
    aggregatedState,
    streamingEnabled,
    stableLoaderEntries,
  } = config

  // Track which loaders have been injected for streaming mode
  // This allows us to incrementally inject completed results without re-processing
  const injectedMenuDefRef = React.useRef<any | null>(null)
  const processedLoadersRef = React.useRef<Set<string>>(new Set())
  const completionOrderRef = React.useRef<string[]>([])
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
        stableLoaderEntries.map((e) => e.path.join('.')),
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
        completionOrderRef.current = [...staticSubmenuIds]
      }

      isInitializedRef.current = true
    }
  }, [streamingEnabled, query, stableLoaderEntries, menuDef])

  return {
    injectedMenuDefRef,
    processedLoadersRef,
    completionOrderRef,
  }
}
