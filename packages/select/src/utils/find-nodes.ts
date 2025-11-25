import type { ItemDef, ItemNode, Menu, Node } from '@bazza-ui/menu'
import type { SelectMenuDef, SelectNodeDef } from '../types.js'

/**
 * Find a single item by its value in the menu tree.
 * Works with both runtime nodes (Menu) and definitions (SelectMenuDef).
 */
export function findNodeByValue<TData = unknown>(
  menu: Menu<TData> | SelectMenuDef<TData> | undefined,
  value: string | undefined,
): ItemNode<TData> | ItemDef<TData> | undefined {
  if (!value || !menu) return undefined

  // Recursively search through menu nodes
  const search = (
    nodes: (Node<TData> | SelectNodeDef<TData>)[],
  ): ItemNode<TData> | ItemDef<TData> | undefined => {
    for (const node of nodes) {
      // Check if this is an item node with matching value
      if (node.kind === 'item') {
        const itemValue = (node as any).value ?? (node as any).id
        if (itemValue === value) {
          return node as ItemNode<TData> | ItemDef<TData>
        }
      }

      // Search in group children
      if (node.kind === 'group' && (node as any).nodes) {
        const found = search((node as any).nodes)
        if (found) return found
      }

      // Search in submenu children (for runtime menu nodes)
      if (node.kind === 'submenu' && (node as any).nodes) {
        const found = search((node as any).nodes)
        if (found) return found
      }
    }
    return undefined
  }

  return search(menu.nodes || [])
}

/**
 * Find multiple items by their values in the menu tree.
 * Works with both runtime nodes (Menu) and definitions (SelectMenuDef).
 */
export function findNodesByValues<TData = unknown>(
  menu: Menu<TData> | SelectMenuDef<TData> | undefined,
  values: string[] | undefined,
): (ItemNode<TData> | ItemDef<TData>)[] {
  if (!values || values.length === 0 || !menu) return []

  const nodes: (ItemNode<TData> | ItemDef<TData>)[] = []

  for (const value of values) {
    const node = findNodeByValue(menu, value)
    if (node) {
      nodes.push(node)
    }
  }

  return nodes
}
