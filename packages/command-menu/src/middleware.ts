/**
 * Command menu-specific middleware helpers.
 * These helpers provide properly typed control parameters for CommandMenuControl.
 */

import {
  composeMiddleware as baseComposeMiddleware,
  createNew as baseCreateNew,
  type MenuMiddleware,
} from '@bazza-ui/menu/middleware'
import type { CommandMenuControl } from './control.js'

/**
 * Creates a "create new" middleware with properly typed CommandMenuControl.
 *
 * @example
 * ```tsx
 * import { createNew } from '@bazza-ui/command-menu/middleware'
 *
 * const labelsMenu: CommandSubmenuDef = {
 *   middleware: createNew({
 *     showWhen: 'no-exact-match',
 *     onCreate: ({ control }) => {
 *       control?.open() // CommandMenuControl methods available!
 *     }
 *   })
 * }
 * ```
 */
export function createNew<TData = unknown>(
  ...args: Parameters<typeof baseCreateNew<TData, CommandMenuControl<TData>>>
): MenuMiddleware<TData, CommandMenuControl<TData>> {
  return baseCreateNew<TData, CommandMenuControl<TData>>(...args)
}

/**
 * Composes multiple middleware with properly typed CommandMenuControl.
 *
 * @example
 * ```tsx
 * import { composeMiddleware, createNew } from '@bazza-ui/command-menu/middleware'
 *
 * const menu: CommandMenuDef = {
 *   middleware: composeMiddleware([
 *     createNew({
 *       onCreate: ({ control }) => {
 *         control?.close() // CommandMenuControl methods!
 *       }
 *     })
 *   ])
 * }
 * ```
 */
export function composeMiddleware<TData = unknown>(
  middlewares: (
    | MenuMiddleware<TData, CommandMenuControl<TData>>
    | undefined
    | null
  )[],
): MenuMiddleware<TData, CommandMenuControl<TData>> {
  return baseComposeMiddleware<TData, CommandMenuControl<TData>>(middlewares)
}
