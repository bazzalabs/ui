import type { ItemNode, Node, ScoredNode, SubmenuNode } from '../types.js'
import { buildBreadcrumbs } from './breadcrumb.js'
import { commandScore } from './command-score.js'

/**
 * Options for scoring nodes.
 */
export type ScoreNodesOptions = {
  /**
   * The root menu ID (used to determine breadcrumb depth).
   * Pass this to avoid including the root menu in breadcrumbs.
   */
  rootMenuId: string

  /**
   * Whether to include breadcrumbs in scored results.
   * Breadcrumbs are extracted from the node's parent chain.
   * Default: true
   */
  includeBreadcrumbs?: boolean
}

/**
 * Scores a collection of nodes against a search query.
 * Only items and submenus are scored (groups, separators, loading nodes are skipped).
 *
 * @param nodes - Flattened array of nodes to score
 * @param query - Search query string
 * @param options - Scoring options
 * @returns Array of scored nodes with scores > 0
 *
 * @example
 * ```ts
 * const allNodes = flatten(menu, { deep: true })
 * const scored = scoreNodes(allNodes, 'settings', { rootMenuId: menu.id })
 * ```
 */
export function scoreNodes<T = unknown>(
  nodes: Node<T>[],
  query: string,
  options: ScoreNodesOptions,
): ScoredNode<T>[] {
  const { rootMenuId, includeBreadcrumbs = true } = options
  const out: ScoredNode<T>[] = []

  for (const n of nodes) {
    // Skip hidden nodes
    if ((n as any).hidden) continue

    if (n.kind === 'item') {
      const itemNode = n as ItemNode<T>

      // Score the item using fuzzy search
      const score = commandScore(itemNode.id, query, itemNode.keywords)

      if (score > 0) {
        // Extract breadcrumbs from node's parent chain (if enabled)
        const trail = includeBreadcrumbs
          ? buildBreadcrumbs(itemNode, rootMenuId)
          : { breadcrumbs: [], breadcrumbIds: [] }

        out.push({
          node: itemNode,
          score,
          breadcrumbs: trail.breadcrumbs,
          breadcrumbIds: trail.breadcrumbIds,
        })
      }
    } else if (n.kind === 'submenu') {
      const submenuNode = n as SubmenuNode<T>

      // Score the submenu trigger itself (not its children)
      const score = commandScore(submenuNode.id, query, submenuNode.keywords)

      if (score > 0) {
        // Extract breadcrumbs from node's parent chain (if enabled)
        const trail = includeBreadcrumbs
          ? buildBreadcrumbs(submenuNode, rootMenuId)
          : { breadcrumbs: [], breadcrumbIds: [] }

        out.push({
          node: submenuNode,
          score,
          breadcrumbs: trail.breadcrumbs,
          breadcrumbIds: trail.breadcrumbIds,
        })
      }
    }
    // Groups, separators, and loading nodes are not scored
  }

  return out
}
