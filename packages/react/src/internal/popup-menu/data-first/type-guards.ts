// ============================================================================
// Type Guards
// ============================================================================

import type { PopupMenuNode } from '../menu-tree/types.js'
import type {
  LinkItemDef,
  NodeDef,
  RowNodeDef,
  SubmenuDef,
  SubpageDef,
  TreeItemDef,
} from './types.js'

// ============================================================================
// Type Guards
// ============================================================================

export function isLinkItemDef(node: NodeDef): node is LinkItemDef {
  return node.kind === 'link-item'
}

export function isTreeItemDef(node: NodeDef): node is TreeItemDef {
  return node.kind === 'tree-item'
}

// ============================================================================
// Menu Node Guards
// ============================================================================
//
// `PopupMenuNode<NodeDef>.kind` mirrors `def.kind` but does not narrow `def`;
// these guards narrow the whole node by its authored def.

export function isMenuNodeOfKind<K extends NodeDef['kind']>(
  node: PopupMenuNode,
  kind: K,
): node is PopupMenuNode<Extract<NodeDef, { kind: K }>> {
  return node.def.kind === kind
}

export function isRowMenuNode(
  node: PopupMenuNode,
): node is PopupMenuNode<RowNodeDef> {
  const kind = node.def.kind
  return (
    kind === 'item' ||
    kind === 'link-item' ||
    kind === 'radio-item' ||
    kind === 'checkbox-item' ||
    kind === 'submenu' ||
    kind === 'subpage' ||
    kind === 'tree-item'
  )
}

export function isBranchMenuNode(
  node: PopupMenuNode,
): node is PopupMenuNode<SubmenuDef | SubpageDef> {
  return node.def.kind === 'submenu' || node.def.kind === 'subpage'
}
