import * as React from 'react'
import { flatten } from '../primitives/menu-model.js'
import type {
  GroupNode,
  LoaderProgress,
  LoadingNode,
  Menu,
  Node,
} from '../types.js'
import { scoreNodes } from '../utils/node-scoring.js'
import {
  deduplicateById,
  partitionByKind,
  sortByCompletionOrder,
  sortByScore,
} from '../utils/sort-utils.js'

/**
 * Filter mode for nodes.
 * - 'shallow': Only return top-level nodes (for action menus, dropdowns)
 * - 'deep': Include nested submenu children (for command menus with deep search)
 */
export type FilterMode = 'shallow' | 'deep'

/**
 * Options for filtering and sorting nodes.
 */
export type UseFilteredNodesOptions = {
  /**
   * Filter mode.
   * - 'shallow': Return top-level nodes only (default for action menus)
   * - 'deep': Include nested submenu children (default for command menus)
   */
  mode?: FilterMode

  /**
   * Whether streaming mode is enabled.
   * In streaming mode, results are sorted by completion order to prevent jumping.
   */
  streamingEnabled?: boolean

  /**
   * Loader completion order (for streaming mode).
   * Array of submenu IDs in the order they completed loading.
   */
  completionOrder?: string[]

  /**
   * Custom sort function to override default sorting.
   * Applied after scoring but before partitioning and deduplication.
   */
  customSort?: (a: any, b: any) => number

  /**
   * Custom filter function to filter out nodes.
   * Applied after scoring but before sorting.
   */
  customFilter?: (node: Node<any>) => boolean
}

/**
 * Result from useFilteredNodes hook.
 */
export type UseFilteredNodesResult<T> = {
  /**
   * Filtered and sorted nodes with search metadata.
   * These are the nodes that match the query (or all nodes if no query).
   */
  filteredNodes: Node<T>[]

  /**
   * Display nodes ready for rendering.
   * In streaming mode, includes a loading node at the end if loaders are in progress.
   */
  displayNodes: Node<T>[]
}

/**
 * Filters, scores, and sorts menu nodes based on a search query.
 * Handles both shallow (action menu) and deep (command menu) filtering.
 *
 * @param menu - The menu instance to filter
 * @param query - Search query string (empty string = no filtering)
 * @param options - Filtering and sorting options
 * @returns Filtered and display-ready nodes
 *
 * @example Shallow filtering (action menu)
 * ```ts
 * const { filteredNodes, displayNodes } = useFilteredNodes(menu, query, {
 *   mode: 'shallow',
 * })
 * ```
 *
 * @example Deep filtering with streaming (command menu)
 * ```ts
 * const { filteredNodes, displayNodes } = useFilteredNodes(menu, query, {
 *   mode: 'deep',
 *   streamingEnabled: isStreaming,
 *   completionOrder: menu.loadingState?.completionOrder,
 * })
 * ```
 */
export function useFilteredNodes<T = unknown>(
  menu: Menu<T>,
  query: string,
  options: UseFilteredNodesOptions = {},
): UseFilteredNodesResult<T> {
  const {
    mode = 'deep',
    streamingEnabled = false,
    completionOrder = [],
    customSort,
    customFilter,
  } = options

  // Memoize the filtered nodes computation
  const filteredNodes = React.useMemo(() => {
    if (!query) {
      // No query - return all navigable nodes (shallow)
      const allNodes = flatten(menu, { deep: false })
      return allNodes.filter(
        (n) =>
          n.kind === 'item' ||
          n.kind === 'submenu' ||
          n.kind === 'separator' ||
          // Only include groups with headings
          (n.kind === 'group' && (n as GroupNode<T>).heading),
      )
    }

    // With query - flatten based on mode
    const deep = mode === 'deep'
    const allNodes = flatten(menu, { deep })

    // Score all nodes
    const scored = scoreNodes(allNodes, query, {
      rootMenuId: menu.id,
      includeBreadcrumbs: deep,
    })

    // Apply custom filter if provided
    const filtered = customFilter
      ? scored.filter((s) => customFilter(s.node))
      : scored

    // Sort nodes
    if (customSort) {
      // Use custom sort function
      filtered.sort(customSort)
    } else if (streamingEnabled && completionOrder.length > 0) {
      // Streaming mode: sort by completion order
      sortByCompletionOrder(filtered, completionOrder)
    } else {
      // Blocking mode: sort by score
      sortByScore(filtered)
    }

    // Partition by kind (items first, then submenus) - but only in non-streaming mode
    const partitioned =
      streamingEnabled && completionOrder.length > 0
        ? filtered
        : partitionByKind(filtered)

    // Deduplicate by node ID
    const deduplicated = deduplicateById(partitioned)

    // Enrich nodes with search context
    return deduplicated.map((s) => ({
      ...s.node,
      search: {
        query,
        score: s.score,
        isDeep: s.breadcrumbs.length > 0,
        breadcrumbs: s.breadcrumbs,
        breadcrumbIds: s.breadcrumbIds,
      },
    })) as Node<T>[]
  }, [
    menu,
    query,
    mode,
    streamingEnabled,
    completionOrder,
    customSort,
    customFilter,
  ])

  // Prepare display nodes (includes loading node in streaming mode)
  const displayNodes = React.useMemo(() => {
    let nodes = filteredNodes

    // In streaming mode, append a LoadingNode at the end if there are loaders in progress
    const loadingState = (menu as any).loadingState
    const hasInProgressLoaders =
      loadingState?.inProgressPaths && loadingState.inProgressPaths.size > 0

    if (streamingEnabled && hasInProgressLoaders && query && loadingState) {
      const loadingNode: LoadingNode = {
        kind: 'loading',
        id: '__streaming-loading__',
        parent: menu,
        def: {
          kind: 'loading',
          id: '__streaming-loading__',
        },
        progress: (loadingState.progress ?? []) as LoaderProgress[],
        inProgressPaths: loadingState.inProgressPaths
          ? Array.from(loadingState.inProgressPaths)
          : [],
        completedPaths: loadingState.completedPaths
          ? Array.from(loadingState.completedPaths)
          : [],
      }

      nodes = [...nodes, loadingNode as Node<T>]
    }

    return nodes
  }, [filteredNodes, menu, streamingEnabled, query])

  return { filteredNodes, displayNodes }
}
