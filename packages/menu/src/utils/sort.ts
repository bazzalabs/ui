import type { ScoredNode } from '../types.js'

/**
 * Sorts scored nodes by score in descending order (highest score first).
 *
 * @param nodes - Array of scored nodes to sort
 * @returns Sorted array (mutates in place and returns)
 *
 * @example
 * ```ts
 * const sorted = sortByScore(scoredNodes)
 * ```
 */
export function sortByScore<T>(nodes: ScoredNode<T>[]): ScoredNode<T>[] {
  return nodes.sort((a, b) => b.score - a.score)
}

/**
 * Sorts scored nodes by loader completion order (for streaming mode).
 * This prevents visual jumping when new results stream in.
 *
 * Sorting rules:
 * 1. Static nodes (no breadcrumbs) come FIRST
 * 2. Static nodes are sorted by score
 * 3. Loader results (with breadcrumbs) APPEND in completion order
 * 4. Loader results from the same submenu maintain score order
 *
 * @param nodes - Array of scored nodes to sort
 * @param completionOrder - Array of submenu IDs in completion order
 * @returns Sorted array (mutates in place and returns)
 *
 * @example
 * ```ts
 * const sorted = sortByCompletionOrder(scoredNodes, ['settings', 'help'])
 * // Static nodes first (sorted by score), then 'settings' results, then 'help' results
 * ```
 */
export function sortByCompletionOrder<T>(
  nodes: ScoredNode<T>[],
  completionOrder: string[],
): ScoredNode<T>[] {
  return nodes.sort((a, b) => {
    const aHasBreadcrumbs = a.breadcrumbIds.length > 0
    const bHasBreadcrumbs = b.breadcrumbIds.length > 0

    // Static nodes (no breadcrumbs) come FIRST, then loader results APPEND
    if (!aHasBreadcrumbs && bHasBreadcrumbs) return -1 // a is static, comes first
    if (aHasBreadcrumbs && !bHasBreadcrumbs) return 1 // b is static, comes first

    // If both are static nodes (no breadcrumbs), sort by score
    if (!aHasBreadcrumbs && !bHasBreadcrumbs) {
      return b.score - a.score
    }

    // If both are child items from loaders, sort by loader completion order
    if (aHasBreadcrumbs && bHasBreadcrumbs) {
      // Use the first breadcrumb ID (immediate parent submenu)
      const aPath = a.breadcrumbIds[0] || ''
      const bPath = b.breadcrumbIds[0] || ''
      const aIndex = completionOrder.indexOf(aPath)
      const bIndex = completionOrder.indexOf(bPath)

      // Both are in completion order - sort by order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }
      // Only a is in completion order
      if (aIndex !== -1) return -1
      // Only b is in completion order
      if (bIndex !== -1) return 1

      // Both have breadcrumbs but not in completion order - fall back to score
      return b.score - a.score
    }

    // Fallback
    return 0
  })
}

/**
 * Partitions scored nodes by kind: items first, then submenus.
 * Maintains the relative order within each partition.
 *
 * @param nodes - Array of scored nodes to partition
 * @returns Partitioned array (items first, then submenus)
 *
 * @example
 * ```ts
 * const partitioned = partitionByKind(scoredNodes)
 * // All items first, then all submenus
 * ```
 */
export function partitionByKind<T>(nodes: ScoredNode<T>[]): ScoredNode<T>[] {
  const items = nodes.filter((s) => s.node.kind === 'item')
  const submenus = nodes.filter((s) => s.node.kind === 'submenu')
  return [...items, ...submenus]
}

/**
 * Deduplicates scored nodes by node ID.
 * Keeps the first occurrence of each unique ID.
 *
 * @param nodes - Array of scored nodes to deduplicate
 * @returns Deduplicated array
 *
 * @example
 * ```ts
 * const unique = deduplicateById(scoredNodes)
 * ```
 */
export function deduplicateById<T>(nodes: ScoredNode<T>[]): ScoredNode<T>[] {
  const seen = new Set<string>()
  return nodes.filter((s) => {
    if (seen.has(s.node.id)) {
      return false
    }
    seen.add(s.node.id)
    return true
  })
}
