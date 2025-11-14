import type { CreateNewConfig, MenuMiddleware } from './types.js'

/**
 * Middleware that adds a "create new" item to search results.
 *
 * This middleware is designed for menus where users can create new items
 * based on their search query (e.g., creating a new label, tag, or category).
 *
 * @example
 * ```tsx
 * import { createNew } from '@bazza-ui/action-menu/middleware'
 *
 * const labelsMenu: SubmenuDef = {
 *   id: 'labels',
 *   nodes: labels.map(label => ({ ... })),
 *   middleware: createNew({
 *     showWhen: 'no-exact-match',
 *     position: 'bottom',
 *     label: (query) => `Create new label: ${query}`,
 *     icon: <PlusIcon />,
 *     onCreate: async (query) => {
 *       const newLabel = await api.createLabel({ name: query })
 *       toast.success(`Created "${newLabel.name}"`)
 *     }
 *   })
 * }
 * ```
 *
 * @param config - Configuration for the create new middleware
 * @returns A middleware object with transformNodes hook
 */
export function createNew<T = unknown>(
  config: CreateNewConfig<T>,
): MenuMiddleware<T> {
  return {
    transformNodes: (context) => {
      const { nodes, query, mode, createNode, hasExactMatch, allNodes, menu } =
        context
      // Only run in search mode
      if (mode !== 'search' || !query?.trim()) {
        return nodes
      }

      // Evaluate the showWhen condition
      const shouldShow = evaluateShowWhen(
        config.showWhen,
        query,
        nodes,
        hasExactMatch,
        config.minQueryLength,
      )

      if (!shouldShow) {
        return nodes
      }

      // Generate the label for the create item
      const label =
        typeof config.label === 'function'
          ? config.label(query)
          : (config.label ?? `Create: ${query}`)

      // Create the synthetic node
      const createNewNode = createNode({
        kind: 'item',
        id: config.id ?? `__create-new-${query}`,
        label,
        icon: config.icon,
        closeOnSelect: config.closeOnSelect ?? false,
        render: config.render
          ? (args) =>
              config.render!({
                query,
                bind: args.bind,
                nodes,
                allNodes,
                mode,
                menu,
              })
          : undefined,
        onSelect: () => config.onCreate(query),
      })

      // Position at top or bottom (default: bottom)
      return config.position === 'top'
        ? [createNewNode, ...nodes]
        : [...nodes, createNewNode]
    },
  }
}

/**
 * Evaluates the showWhen condition to determine if the create item should be displayed
 */
function evaluateShowWhen<T>(
  condition: CreateNewConfig<T>['showWhen'],
  query: string,
  nodes: any[],
  hasExactMatch: (q: string) => boolean,
  minQueryLength?: number,
): boolean {
  switch (condition) {
    case 'always':
      return true

    case 'no-results':
      return nodes.length === 0

    case 'has-query':
      return query.length >= (minQueryLength ?? 1)

    case 'no-exact-match':
      return !hasExactMatch(query)

    default:
      return false
  }
}
