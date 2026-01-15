import { commandScore } from '../../listbox/utils/command-score.js'
import type {
  DisplayNode,
  GroupDef,
  ItemDef,
  NodeDef,
  RowRenderContext,
  ScoredNode,
  SubmenuDef,
} from './types.js'

// ============================================================================
// Type Guards
// ============================================================================

export function isItemDef(node: NodeDef): node is ItemDef {
  return node.kind === 'item'
}

export function isSubmenuDef(node: NodeDef): node is SubmenuDef {
  return node.kind === 'submenu'
}

export function isGroupDef(node: NodeDef): node is GroupDef {
  return node.kind === 'group'
}

export function isSeparatorDef(
  node: NodeDef,
): node is { kind: 'separator'; id?: string } {
  return node.kind === 'separator'
}

// ============================================================================
// Flatten Nodes for Search
// ============================================================================

interface FlattenOptions {
  /** Whether to include children of submenus (deep search) */
  deep?: boolean
  /** Parent breadcrumb titles */
  breadcrumbs?: string[]
  /** Parent breadcrumb IDs */
  breadcrumbIds?: string[]
}

interface FlattenedNode {
  node: ItemDef | SubmenuDef
  breadcrumbs: string[]
  breadcrumbIds: string[]
}

/**
 * Flattens a tree of node definitions into a flat array.
 * When deep=true, includes children of submenus with their breadcrumb paths.
 */
export function flattenNodes(
  nodes: NodeDef[],
  options: FlattenOptions = {},
): FlattenedNode[] {
  const { deep = false, breadcrumbs = [], breadcrumbIds = [] } = options
  const result: FlattenedNode[] = []

  for (const node of nodes) {
    if (node.kind === 'separator') {
      // Skip separators during search
      continue
    }

    if (node.kind === 'group') {
      // Groups are containers - recurse into their children
      result.push(
        ...flattenNodes(node.nodes, { deep, breadcrumbs, breadcrumbIds }),
      )
      continue
    }

    if (node.hidden) {
      continue
    }

    if (node.kind === 'item') {
      result.push({
        node,
        breadcrumbs,
        breadcrumbIds,
      })
      continue
    }

    if (node.kind === 'submenu') {
      // Always include the submenu trigger itself
      result.push({
        node,
        breadcrumbs,
        breadcrumbIds,
      })

      // If deep search enabled and submenu allows it, include children
      if (deep && node.deepSearch !== false && node.nodes) {
        const childBreadcrumbs = [...breadcrumbs, node.title]
        const childBreadcrumbIds = [...breadcrumbIds, node.id]

        result.push(
          ...flattenNodes(node.nodes, {
            deep,
            breadcrumbs: childBreadcrumbs,
            breadcrumbIds: childBreadcrumbIds,
          }),
        )
      }
    }
  }

  return result
}

// ============================================================================
// Score Nodes
// ============================================================================

/**
 * Scores nodes against a search query.
 * Returns only nodes with a score > 0.
 */
export function scoreNodes(
  flattenedNodes: FlattenedNode[],
  query: string,
): ScoredNode[] {
  if (!query) {
    // No query - return all nodes with score 1
    return flattenedNodes.map(({ node, breadcrumbs, breadcrumbIds }) => ({
      node,
      score: 1,
      breadcrumbs,
      breadcrumbIds,
    }))
  }

  const results: ScoredNode[] = []

  for (const { node, breadcrumbs, breadcrumbIds } of flattenedNodes) {
    const label =
      node.kind === 'submenu' ? (node.label ?? node.title) : node.label
    const keywords = node.keywords

    const score = commandScore(label, query, keywords)

    if (score > 0) {
      results.push({
        node,
        score,
        breadcrumbs,
        breadcrumbIds,
      })
    }
  }

  return results
}

// ============================================================================
// Sort Nodes
// ============================================================================

/**
 * Sorts scored nodes by score (descending).
 */
export function sortByScore(nodes: ScoredNode[]): ScoredNode[] {
  return [...nodes].sort((a, b) => b.score - a.score)
}

/**
 * Partitions nodes: items first, then submenu triggers.
 * This ensures items appear before submenu triggers in search results.
 */
export function partitionByKind(nodes: ScoredNode[]): ScoredNode[] {
  const items = nodes.filter((n) => n.node.kind === 'item')
  const submenus = nodes.filter((n) => n.node.kind === 'submenu')
  return [...items, ...submenus]
}

/**
 * Deduplicates nodes by their composite ID (breadcrumbIds + node.id).
 * This handles the case where the same node appears multiple times in the tree.
 */
export function deduplicateNodes(nodes: ScoredNode[]): ScoredNode[] {
  const seen = new Set<string>()
  const result: ScoredNode[] = []

  for (const scoredNode of nodes) {
    const compositeId = [...scoredNode.breadcrumbIds, scoredNode.node.id].join(
      '.',
    )
    if (!seen.has(compositeId)) {
      seen.add(compositeId)
      result.push(scoredNode)
    }
  }

  return result
}

// ============================================================================
// Build Display Nodes
// ============================================================================

/**
 * Converts scored nodes to display nodes with render context.
 */
export function buildDisplayNodes(
  scoredNodes: ScoredNode[],
  query: string,
  highlightedId: string | null,
): DisplayNode[] {
  return scoredNodes.map((scoredNode) => {
    const isDeepSearchResult = scoredNode.breadcrumbs.length > 0

    const context: RowRenderContext = {
      search: query
        ? {
            query,
            score: scoredNode.score,
          }
        : null,
      breadcrumbs: scoredNode.breadcrumbs,
      isDeepSearchResult,
      highlighted: scoredNode.node.id === highlightedId,
      disabled: scoredNode.node.disabled ?? false,
    }

    return {
      node: scoredNode.node,
      context,
    }
  })
}

// ============================================================================
// Browse Mode - Get Shallow Nodes
// ============================================================================

/**
 * Gets nodes for browse mode (no search).
 * Returns only top-level items and submenu triggers, preserving separators.
 */
export function getBrowseNodes(
  nodes: NodeDef[],
  highlightedId: string | null,
): DisplayNode[] {
  const result: DisplayNode[] = []

  for (const node of nodes) {
    if (node.kind === 'separator') {
      // Skip separators - they're not focusable
      continue
    }

    if (node.kind === 'group') {
      // Recurse into groups
      result.push(...getBrowseNodes(node.nodes, highlightedId))
      continue
    }

    if (node.hidden) {
      continue
    }

    const context: RowRenderContext = {
      search: null,
      breadcrumbs: [],
      isDeepSearchResult: false,
      highlighted: node.id === highlightedId,
      disabled: node.disabled ?? false,
    }

    result.push({ node, context })
  }

  return result
}

// ============================================================================
// Full Pipeline
// ============================================================================

export interface FilterNodesOptions {
  /** The search query */
  query: string
  /** The node definitions to filter */
  nodes: NodeDef[]
  /** Currently highlighted node ID */
  highlightedId: string | null
  /** Whether deep search is enabled */
  deepSearch?: boolean
  /** Minimum query length for deep search */
  minLength?: number
}

/**
 * Main filtering pipeline.
 * Handles both browse mode and search mode (shallow and deep).
 */
export function filterNodes(options: FilterNodesOptions): {
  displayNodes: DisplayNode[]
  isDeepSearching: boolean
} {
  const {
    query,
    nodes,
    highlightedId,
    deepSearch = true,
    minLength = 0,
  } = options

  // Browse mode - no query
  if (!query) {
    return {
      displayNodes: getBrowseNodes(nodes, highlightedId),
      isDeepSearching: false,
    }
  }

  // Determine if deep search should activate
  const shouldDeepSearch = deepSearch && query.length >= minLength

  // Flatten nodes
  const flattenedNodes = flattenNodes(nodes, { deep: shouldDeepSearch })

  // Score nodes
  const scoredNodes = scoreNodes(flattenedNodes, query)

  // Sort by score
  const sortedNodes = sortByScore(scoredNodes)

  // Partition (items first, then submenus)
  const partitionedNodes = partitionByKind(sortedNodes)

  // Deduplicate
  const uniqueNodes = deduplicateNodes(partitionedNodes)

  // Build display nodes with context
  const displayNodes = buildDisplayNodes(uniqueNodes, query, highlightedId)

  return {
    displayNodes,
    isDeepSearching: shouldDeepSearch,
  }
}

// ============================================================================
// Get Navigable IDs
// ============================================================================

/**
 * Gets the IDs of all navigable (non-disabled) nodes.
 * Used for keyboard navigation.
 */
export function getNavigableIds(displayNodes: DisplayNode[]): string[] {
  return displayNodes.filter((dn) => !dn.node.disabled).map((dn) => dn.node.id)
}

/**
 * Gets the first navigable node ID.
 */
export function getFirstNavigableId(
  displayNodes: DisplayNode[],
): string | null {
  const ids = getNavigableIds(displayNodes)
  return ids[0] ?? null
}
