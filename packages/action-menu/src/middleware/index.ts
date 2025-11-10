/**
 * ActionMenu Middleware
 *
 * Middleware functions allow you to transform nodes at various points in the rendering pipeline.
 * There are three transformation hooks available:
 *
 * - **beforeFilter**: Transform nodes before search/filter (pre-processing)
 * - **afterFilter**: Transform search results after scoring (search-specific transformations)
 * - **transformNodes**: Transform flattened nodes before rendering (most commonly used)
 *
 * ## Composing Middleware
 *
 * Use `composeMiddleware` to stack multiple middleware functions:
 *
 * ```tsx
 * import { composeMiddleware, createNew } from '@bazza-ui/action-menu'
 *
 * const menu: MenuDef = {
 *   nodes: [...],
 *   middleware: composeMiddleware(
 *     createNew({ ... }),
 *     myCustomMiddleware,
 *   )
 * }
 * ```
 *
 * @module middleware
 */

export { composeMiddleware } from './compose.js'
export { createNew } from './create-new.js'

export type {
  AfterFilterContext,
  BeforeFilterContext,
  CreateNewConfig,
  MenuMiddleware,
  SearchResult,
  TransformNodesContext,
} from './types.js'
