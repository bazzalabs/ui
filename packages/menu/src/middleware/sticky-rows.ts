import type { MenuControl } from '../control.js'
import type { CheckboxItemNode, ItemNode, Node } from '../types.js'
import type { MenuMiddleware } from './types.js'

/**
 * Configuration for the sticky rows middleware
 *
 * @typeParam TData - The data type for menu nodes
 * @typeParam TControl - The control API type (defaults to MenuControl<TData>)
 */
export interface StickyRowsConfig<
  TData = unknown,
  TControl extends MenuControl<TData> = MenuControl<TData>,
> {
  /**
   * Optional custom sort function for checked items.
   * By default, checked items maintain their original order.
   */
  sortChecked?: (a: Node<TData>, b: Node<TData>) => number
  /**
   * Optional custom sort function for unchecked items.
   * By default, unchecked items maintain their original order.
   */
  sortUnchecked?: (a: Node<TData>, b: Node<TData>) => number
}

/**
 * Middleware that keeps checked items "sticky" at the top of the menu.
 *
 * This middleware sorts menu items so that:
 * - When the menu opens, all checked items appear first, followed by unchecked items
 * - While the menu is open, checking/unchecking items does NOT change their position
 * - When the menu closes and re-opens, the sort order is recalculated based on current state
 *
 * This is useful for multi-select menus where you want checked items grouped together,
 * but don't want jarring reordering as the user toggles items.
 *
 * @example Basic usage
 * ```tsx
 * import { stickyRows } from '@bazza-ui/menu/middleware'
 *
 * const menu: MenuDef = {
 *   id: 'filters',
 *   nodes: [
 *     { kind: 'item', variant: 'checkbox', id: 'a', label: 'Option A', checked: false, onCheckedChange: ... },
 *     { kind: 'item', variant: 'checkbox', id: 'b', label: 'Option B', checked: true, onCheckedChange: ... },
 *     { kind: 'item', variant: 'checkbox', id: 'c', label: 'Option C', checked: false, onCheckedChange: ... },
 *   ],
 *   middleware: stickyRows()
 * }
 * // Result: B appears first (checked), then A and C (unchecked)
 * ```
 *
 * @example With custom sorting
 * ```tsx
 * middleware: stickyRows({
 *   sortChecked: (a, b) => (a.label ?? '').localeCompare(b.label ?? ''),
 *   sortUnchecked: (a, b) => (a.label ?? '').localeCompare(b.label ?? '')
 * })
 * ```
 *
 * @param config - Optional configuration for custom sorting
 * @returns A middleware object with transformNodes hook
 */
export function stickyRows<
  TData = unknown,
  TControl extends MenuControl<TData> = MenuControl<TData>,
>(config?: StickyRowsConfig<TData, TControl>): MenuMiddleware<TData, TControl> {
  // Track the initial order snapshot when menu opens
  let initialOrderMap: Map<string, number> | null = null
  // Track which items were checked when the menu opened
  let initialCheckedSet: Set<string> | null = null
  // Track the last known open state
  let wasOpen = false

  return {
    beforeFilter: (context) => {
      const { nodes, menu } = context

      // Detect menu open/close transitions
      const isOpen =
        'open' in menu && menu.open?.value !== undefined
          ? menu.open.value
          : true // Assume open if no state descriptor

      // Menu just opened - capture initial state
      if (isOpen && !wasOpen) {
        // Build initial order map
        initialOrderMap = new Map()
        initialCheckedSet = new Set()

        nodes.forEach((node, index) => {
          initialOrderMap!.set(node.id, index)

          // Check if this is a checked checkbox item
          if (node.kind === 'item' && (node as any).variant === 'checkbox') {
            const checkboxNode = node as CheckboxItemNode<TData>
            if (checkboxNode.checked) {
              initialCheckedSet!.add(node.id)
            }
          }
        })
      }

      // Menu just closed - clear state
      if (!isOpen && wasOpen) {
        initialOrderMap = null
        initialCheckedSet = null
      }

      wasOpen = isOpen

      return nodes
    },

    transformNodes: (context) => {
      const { nodes } = context

      // No initial state captured yet (menu hasn't opened)
      if (!initialOrderMap || !initialCheckedSet) {
        return nodes
      }

      // Separate nodes into checked and unchecked based on INITIAL state
      const checkedNodes: Node<TData>[] = []
      const uncheckedNodes: Node<TData>[] = []

      for (const node of nodes) {
        // Only apply sticky behavior to checkbox items
        if (node.kind === 'item' && (node as any).variant === 'checkbox') {
          // Use the initial checked state, not current state
          if (initialCheckedSet.has(node.id)) {
            checkedNodes.push(node)
          } else {
            uncheckedNodes.push(node)
          }
        } else {
          // Non-checkbox items go to unchecked group
          uncheckedNodes.push(node)
        }
      }

      // Sort each group by original order (or custom sort if provided)
      const sortByInitialOrder = (a: Node<TData>, b: Node<TData>) => {
        const aOrder = initialOrderMap!.get(a.id) ?? Number.MAX_SAFE_INTEGER
        const bOrder = initialOrderMap!.get(b.id) ?? Number.MAX_SAFE_INTEGER
        return aOrder - bOrder
      }

      checkedNodes.sort(config?.sortChecked ?? sortByInitialOrder)
      uncheckedNodes.sort(config?.sortUnchecked ?? sortByInitialOrder)

      // Return checked items first, then unchecked
      return [...checkedNodes, ...uncheckedNodes]
    },
  }
}
