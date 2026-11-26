import {
  defaultGetResolvedId as coreDefaultGetResolvedId,
  resolveNodeDefs as coreResolveNodeDefs,
  staticChildrenOf as coreStaticChildrenOf,
  isMenuNode,
} from '@bazza-ui/menu-core'
import type {
  GetResolvedIdFn,
  PopupMenuIdScope,
  PopupMenuNode,
  UnresolvedMenuNode,
} from './types.js'

// Resolution lives in `@bazza-ui/menu-core`, generic over the Menu Node type.
// This module instantiates it with `PopupMenuNode`.
export {
  childDefsOf,
  contributesDefinitionPath,
  definitionKeyForDef,
} from '@bazza-ui/menu-core'

export const isPopupMenuNode: (value: unknown) => value is PopupMenuNode =
  isMenuNode<PopupMenuNode>

/** Default Resolved ID, using surface-scoped encoded paths unless menu scope is selected. */
export const defaultGetResolvedId: (
  node: UnresolvedMenuNode,
  idScope?: PopupMenuIdScope,
) => string = coreDefaultGetResolvedId

/**
 * Resolve a def list into node instances under `parent`.
 * `basePath` is the path segments contributed by ancestors (the parent's
 * `definitionPath` when the parent contributes a segment, otherwise the parent's
 * own base path); pass `[]` for roots.
 */
export const resolveNodeDefs: (
  defs: readonly PopupMenuNode['def'][],
  parent: PopupMenuNode | null,
  basePath: readonly string[],
  getResolvedId: GetResolvedIdFn,
) => PopupMenuNode[] = coreResolveNodeDefs<PopupMenuNode>

/**
 * The branch's resolved static children: the Menu Nodes whose def is one of
 * the branch def's authored `nodes`, in `children` order. Loader results are
 * grafted as children too but are never in `def.nodes`, so they are excluded
 * whether the graft appended to or replaced the static children.
 */
export const staticChildrenOf: (branch: PopupMenuNode) => PopupMenuNode[] =
  coreStaticChildrenOf<PopupMenuNode>
