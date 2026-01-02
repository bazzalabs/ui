import type { NodeRegistration, SearchResult } from '../types.js'
import { commandScore } from './command-score.js'

/**
 * Scores a node against a search query using command-score fuzzy matching.
 * Returns a score between 0 and 1, where higher = better match.
 */
export function scoreNode<TData>(
  node: NodeRegistration<TData>,
  query: string,
): number {
  if (!query) return 0

  return commandScore(node.textValue, query, node.keywords)
}

/**
 * Scores and filters nodes against a search query.
 * Returns sorted results with breadcrumbs.
 */
export function searchNodes<TData>(
  nodes: NodeRegistration<TData>[],
  query: string,
  getSubmenuLabel: (id: string) => string | undefined,
): SearchResult<TData>[] {
  if (!query.trim()) {
    return []
  }

  const results: SearchResult<TData>[] = []

  for (const node of nodes) {
    const score = scoreNode(node, query)
    if (score > 0) {
      // Build breadcrumbs from parent path
      const breadcrumbs = node.parentPath
        .map((id) => getSubmenuLabel(id))
        .filter((label): label is string => label !== undefined)

      results.push({
        node,
        score,
        breadcrumbs,
        breadcrumbIds: node.parentPath,
      })
    }
  }

  // Sort by score (descending)
  results.sort((a, b) => b.score - a.score)

  return results
}

/**
 * Checks if there's an exact match for the query.
 */
export function hasExactMatch<TData>(
  nodes: NodeRegistration<TData>[],
  query: string,
): boolean {
  const normalizedQuery = query.toLowerCase().trim()
  return nodes.some((node) => node.textValue.toLowerCase() === normalizedQuery)
}
