import type { ItemNode, Node, SubmenuNode } from '../types.js'

/**
 * Breadcrumb trail extracted from a node's parent chain.
 */
export type BreadcrumbTrail = {
  /** Human-readable breadcrumb labels (e.g., ['Settings', 'Advanced']) */
  breadcrumbs: string[]
  /** Breadcrumb IDs (e.g., ['settings', 'advanced']) */
  breadcrumbIds: string[]
}

/**
 * Extracts breadcrumb trail by walking up a node's parent chain.
 * Walks from the node's parent menu up to (but not including) the root menu.
 *
 * @param node - The item or submenu node to extract breadcrumbs from
 * @param rootMenuId - The ID of the root menu (to stop traversal)
 * @returns Breadcrumb trail with labels and IDs
 *
 * @example
 * ```ts
 * const trail = buildBreadcrumbs(itemNode, menu.id)
 * // trail.breadcrumbs = ['Settings', 'Advanced']
 * // trail.breadcrumbIds = ['settings', 'advanced']
 * ```
 */
export function buildBreadcrumbs(
  node: ItemNode<any> | SubmenuNode<any>,
  rootMenuId: string,
): BreadcrumbTrail {
  const breadcrumbs: string[] = []
  const breadcrumbIds: string[] = []

  // Start from the node's parent menu
  let current: any = node.parent

  // Walk up the parent chain until we reach the root menu
  // Note: Child menus (from submenus) have a runtime parent property
  // that points to their parent menu, but this isn't in the type definition
  while (current && current.id !== rootMenuId) {
    // Use title (for menus) or label (for submenu triggers) or fallback to id
    const label = current.title || current.label || current.id
    breadcrumbs.unshift(label)
    breadcrumbIds.unshift(current.id)

    // Move to parent menu (runtime property)
    current = current.parent
  }

  return { breadcrumbs, breadcrumbIds }
}

/**
 * Builds breadcrumbs for all nodes in a collection.
 * This is a convenience function for batch processing.
 *
 * @param nodes - Array of nodes to process
 * @param rootMenuId - The ID of the root menu
 * @returns Map of node ID to breadcrumb trail
 */
export function buildBreadcrumbsForNodes<T>(
  nodes: Node<T>[],
  rootMenuId: string,
): Map<string, BreadcrumbTrail> {
  const map = new Map<string, BreadcrumbTrail>()

  for (const node of nodes) {
    if (node.kind === 'item' || node.kind === 'submenu') {
      const trail = buildBreadcrumbs(node, rootMenuId)
      map.set(node.id, trail)
    }
  }

  return map
}
