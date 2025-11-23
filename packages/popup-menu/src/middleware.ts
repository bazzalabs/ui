/**
 * Popup menu-specific middleware helpers.
 * These helpers provide properly typed control parameters for PopupMenuControl.
 */

import {
  composeMiddleware as baseComposeMiddleware,
  createNew as baseCreateNew,
  type MenuMiddleware,
} from '@bazza-ui/menu/middleware'
import type { PopupMenuControl } from './control.js'

/**
 * Creates a "create new" middleware with properly typed PopupMenuControl.
 *
 * @example
 * ```tsx
 * import { createNew } from '@bazza-ui/popup-menu/middleware'
 *
 * const labelsMenu: PopupSubmenuDef = {
 *   middleware: createNew({
 *     showWhen: 'no-exact-match',
 *     onCreate: ({ control }) => {
 *       control?.close() // PopupMenuControl methods available!
 *     }
 *   })
 * }
 * ```
 */
export function createNew<TData = unknown>(
  ...args: Parameters<typeof baseCreateNew<TData, PopupMenuControl<TData>>>
): MenuMiddleware<TData, PopupMenuControl<TData>> {
  return baseCreateNew<TData, PopupMenuControl<TData>>(...args)
}

/**
 * Composes multiple middleware with properly typed PopupMenuControl.
 *
 * @example
 * ```tsx
 * import { composeMiddleware, createNew } from '@bazza-ui/popup-menu/middleware'
 *
 * const menu: PopupMenuDef = {
 *   middleware: composeMiddleware([
 *     createNew({
 *       onCreate: ({ control }) => {
 *         control?.close() // PopupMenuControl methods!
 *       }
 *     })
 *   ])
 * }
 * ```
 */
export function composeMiddleware<TData = unknown>(
  middlewares: (
    | MenuMiddleware<TData, PopupMenuControl<TData>>
    | undefined
    | null
  )[],
): MenuMiddleware<TData, PopupMenuControl<TData>> {
  return baseComposeMiddleware<TData, PopupMenuControl<TData>>(middlewares)
}
