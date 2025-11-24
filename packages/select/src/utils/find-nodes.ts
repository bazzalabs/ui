import type { ItemNode, Menu, Node } from '@bazza-ui/menu'

/**
 * Find a single item node by its value in the menu tree
 */
export function findNodeByValue<TData = unknown>(
  menu: Menu<TData> | undefined,
  value: string | undefined,
): ItemNode<TData> | undefined {
  if (!value || !menu) return undefined

  // Recursively search through menu nodes
  const search = (nodes: Node<TData>[]): ItemNode<TData> | undefined => {
    for (const node of nodes) {
      // Check if this is an item node with matching value
      if (node.kind === 'item') {
        const itemValue = (node as any).value ?? node.id
        if (itemValue === value) {
          return node as ItemNode<TData>
        }
      }

      // Search in group children
      if (node.kind === 'group' && node.nodes) {
        const found = search(node.nodes)
        if (found) return found
      }

      // Search in submenu children
      if (node.kind === 'submenu' && node.nodes) {
        const found = search(node.nodes)
        if (found) return found
      }
    }
    return undefined
  }

  return search(menu.nodes || [])
}

/**
 * Find multiple item nodes by their values in the menu tree
 */
export function findNodesByValues<TData = unknown>(
  menu: Menu<TData> | undefined,
  values: string[] | undefined,
): ItemNode<TData>[] {
  if (!values || values.length === 0 || !menu) return []

  const nodes: ItemNode<TData>[] = []

  for (const value of values) {
    const node = findNodeByValue(menu, value)
    if (node) {
      nodes.push(node)
    }
  }

  return nodes
}
