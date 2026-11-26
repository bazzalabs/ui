import {
  type MenuTreeResolver as CoreMenuTreeResolver,
  type MenuTreeResolverOptions as CoreMenuTreeResolverOptions,
  createMenuTreeResolver as coreCreateMenuTreeResolver,
} from '@bazza-ui/menu-core'
import type { NodeDef } from '../data-first/types.js'
import type { PopupMenuNode } from './types.js'

// The Menu Tree resolver lives in `@bazza-ui/menu-core`, generic over the
// Menu Node type. This module instantiates it with `PopupMenuNode`.

/**
 * Owns the single resolved node tree for one menu root. Content may be
 * re-supplied at any time (`setContent`) and late defs may be grafted under
 * an already-resolved parent (`graft`); both reconcile by id with a
 * reference fast path, so node instances are stable and repeat calls with
 * identical arguments are no-ops.
 */
export interface MenuTreeResolver
  extends Omit<CoreMenuTreeResolver<PopupMenuNode>, 'getNodeForDef'> {
  /** Node whose current `def` is reference-equal to `def`, if any. */
  getNodeForDef<D extends NodeDef>(def: D): PopupMenuNode<D> | undefined
}

export interface MenuTreeResolverOptions
  extends CoreMenuTreeResolverOptions<PopupMenuNode> {}

export const createMenuTreeResolver: (
  options?: MenuTreeResolverOptions,
) => MenuTreeResolver = coreCreateMenuTreeResolver<PopupMenuNode>
