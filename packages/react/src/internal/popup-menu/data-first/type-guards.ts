// ============================================================================
// Type Guards
// ============================================================================

import {
  isLinkItemDef as coreIsLinkItemDef,
  isRowMenuNode as coreIsRowMenuNode,
  isTreeItemDef as coreIsTreeItemDef,
} from '@bazza-ui/menu-core'
import type { PopupMenuNode } from '../menu-tree/types.js'
import type { LinkItemDef, NodeDef, RowNodeDef, TreeItemDef } from './types.js'

// The guards live in `@bazza-ui/menu-core`, generic over the def and Menu Node
// types. This module instantiates the ones the React layer calls.
export { isBranchMenuNode, isMenuNodeOfKind } from '@bazza-ui/menu-core'

export const isLinkItemDef: (node: NodeDef) => node is LinkItemDef =
  coreIsLinkItemDef<NodeDef>

export const isTreeItemDef: (node: NodeDef) => node is TreeItemDef =
  coreIsTreeItemDef<NodeDef>

export const isRowMenuNode: (
  node: PopupMenuNode,
) => node is PopupMenuNode<RowNodeDef> = coreIsRowMenuNode<PopupMenuNode>
