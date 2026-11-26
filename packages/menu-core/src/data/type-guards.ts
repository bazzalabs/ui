// ============================================================================
// Type Guards
// ============================================================================

import type { MenuNodeOfKind } from '../tree/menu-node.js'
import type { AnyNodeDef } from '../tree/node-def-map.js'
import type { BranchMenuNode, RowMenuNode } from './types.js'

// ============================================================================
// Type Guards
// ============================================================================

export function isLinkItemDef<D extends AnyNodeDef>(
  node: D,
): node is Extract<D, { kind: 'link-item' }> {
  return node.kind === 'link-item'
}

export function isTreeItemDef<D extends AnyNodeDef>(
  node: D,
): node is Extract<D, { kind: 'tree-item' }> {
  return node.kind === 'tree-item'
}

// ============================================================================
// Menu Node Guards
// ============================================================================
//
// A Menu Node's `kind` mirrors `def.kind` but does not narrow `def`;
// these guards narrow the whole node by its authored def.

export function isMenuNodeOfKind<
  N extends { def: AnyNodeDef },
  K extends AnyNodeDef['kind'],
>(node: N, kind: K): node is MenuNodeOfKind<N, K> {
  return node.def.kind === kind
}

export function isRowMenuNode<N extends { def: AnyNodeDef }>(
  node: N,
): node is RowMenuNode<N> {
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

export function isBranchMenuNode<N extends { def: AnyNodeDef }>(
  node: N,
): node is BranchMenuNode<N> {
  return node.def.kind === 'submenu' || node.def.kind === 'subpage'
}
