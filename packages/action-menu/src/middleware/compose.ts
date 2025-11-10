import type { MenuMiddleware } from './types.js'

/**
 * Composes multiple middleware functions into a single middleware object.
 *
 * Each middleware is executed in order (first to last) for each hook:
 * - `beforeFilter`: Each middleware transforms nodes sequentially
 * - `afterFilter`: Each middleware transforms results sequentially
 * - `transformNodes`: Each middleware transforms nodes sequentially
 *
 * @example
 * ```tsx
 * import { composeMiddleware, createNew } from '@bazza-ui/action-menu'
 *
 * const analytics: MenuMiddleware = {
 *   transformNodes: ({ nodes, query }) => {
 *     trackEvent('menu_search', { query, count: nodes.length })
 *     return nodes
 *   }
 * }
 *
 * const menu: MenuDef = {
 *   id: 'labels',
 *   nodes: [...],
 *   middleware: composeMiddleware(
 *     createNew({
 *       showWhen: 'no-exact-match',
 *       onCreate: (query) => createLabel(query)
 *     }),
 *     analytics,
 *   )
 * }
 * ```
 *
 * @param middlewares - Variable number of middleware objects to compose
 * @returns A single composed middleware object
 */
export function composeMiddleware<T = unknown>(
  middlewares: (MenuMiddleware<T> | undefined | null)[],
): MenuMiddleware<T> {
  // Filter out null/undefined middleware
  const validMiddleware = middlewares.filter(
    (m): m is MenuMiddleware<T> => m != null,
  )

  // If no valid middleware, return empty middleware
  if (validMiddleware.length === 0) {
    return {}
  }

  // If only one middleware, return it directly
  if (validMiddleware.length === 1) {
    return validMiddleware[0]!
  }

  // Compose beforeFilter hooks
  const beforeFilterHooks = validMiddleware
    .map((m) => m.beforeFilter)
    .filter((fn): fn is NonNullable<typeof fn> => fn != null)

  const composedBeforeFilter =
    beforeFilterHooks.length > 0
      ? (
          context: Parameters<
            NonNullable<MenuMiddleware<T>['beforeFilter']>
          >[0],
        ) => {
          let nodes = context.nodes
          for (const hook of beforeFilterHooks) {
            nodes = hook({ ...context, nodes })
          }
          return nodes
        }
      : undefined

  // Compose afterFilter hooks
  const afterFilterHooks = validMiddleware
    .map((m) => m.afterFilter)
    .filter((fn): fn is NonNullable<typeof fn> => fn != null)

  const composedAfterFilter =
    afterFilterHooks.length > 0
      ? (
          context: Parameters<NonNullable<MenuMiddleware<T>['afterFilter']>>[0],
        ) => {
          let results = context.results
          for (const hook of afterFilterHooks) {
            results = hook({ ...context, results })
          }
          return results
        }
      : undefined

  // Compose transformNodes hooks
  const transformNodesHooks = validMiddleware
    .map((m) => m.transformNodes)
    .filter((fn): fn is NonNullable<typeof fn> => fn != null)

  const composedTransformNodes =
    transformNodesHooks.length > 0
      ? (
          context: Parameters<
            NonNullable<MenuMiddleware<T>['transformNodes']>
          >[0],
        ) => {
          let nodes = context.nodes
          for (const hook of transformNodesHooks) {
            nodes = hook({ ...context, nodes })
          }
          return nodes
        }
      : undefined

  return {
    beforeFilter: composedBeforeFilter,
    afterFilter: composedAfterFilter,
    transformNodes: composedTransformNodes,
  }
}
