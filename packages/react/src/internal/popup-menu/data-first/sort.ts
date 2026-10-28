// ============================================================================
// Sort Nodes
// ============================================================================

import type { DisplayRowNode, ScoredNode } from './types.js'

// Sort Nodes
// ============================================================================

/**
 * A row's `forceOrder` for sorting at `score`. A row whose score is below its
 * `forceOrderMinScore` sorts as if it had no `forceOrder` (0).
 */
export function getNodeForceOrder(
  def: { forceOrder?: number; forceOrderMinScore?: number },
  score: number,
): number {
  const { forceOrder = 0, forceOrderMinScore } = def
  if (forceOrderMinScore !== undefined && score < forceOrderMinScore) {
    return 0
  }
  return forceOrder
}

/** A display row's search score, which its sort and `forceOrder` both use. */
export function getDisplayRowScore(row: DisplayRowNode): number {
  return row.context.search?.score ?? 0
}

/** `getNodeForceOrder` for a display row, at its search score. */
export function getDisplayRowForceOrder(row: DisplayRowNode): number {
  return getNodeForceOrder(row.node.def, getDisplayRowScore(row))
}

export function compareScoredNodesByForceOrderAndScore(
  a: ScoredNode,
  b: ScoredNode,
): number {
  const orderDiff =
    getNodeForceOrder(a.node.def, a.score) -
    getNodeForceOrder(b.node.def, b.score)
  if (orderDiff !== 0) {
    return orderDiff
  }

  return b.score - a.score
}

export function getRowKindSortRank(
  kind:
    | 'item'
    | 'link-item'
    | 'radio-item'
    | 'checkbox-item'
    | 'tree-item'
    | 'submenu'
    | 'subpage',
): number {
  return kind === 'submenu' || kind === 'subpage' ? 1 : 0
}

export function sortByForceOrderThenKindThenScore(
  a: { forceOrder: number; kindRank: number; score: number },
  b: { forceOrder: number; kindRank: number; score: number },
): number {
  const orderDiff = a.forceOrder - b.forceOrder
  if (orderDiff !== 0) {
    return orderDiff
  }

  const kindDiff = a.kindRank - b.kindRank
  if (kindDiff !== 0) {
    return kindDiff
  }

  return b.score - a.score
}

export function getMinForceOrderFromDisplayRows(
  nodes: DisplayRowNode[],
): number {
  if (nodes.length === 0) {
    return 0
  }

  let minForceOrder = Number.POSITIVE_INFINITY

  for (const item of nodes) {
    const forceOrder = getDisplayRowForceOrder(item)
    if (forceOrder < minForceOrder) {
      minForceOrder = forceOrder
    }
  }

  return minForceOrder === Number.POSITIVE_INFINITY ? 0 : minForceOrder
}

/**
 * Sorts scored nodes by forced order, then score (descending).
 */
export function sortByScore(nodes: ScoredNode[]): ScoredNode[] {
  return [...nodes].sort(compareScoredNodesByForceOrderAndScore)
}

/**
 * Partitions nodes by forced order bucket, then kind.
 * Within each forceOrder bucket, items are shown before submenu/subpage triggers.
 */
export function partitionByKind(nodes: ScoredNode[]): ScoredNode[] {
  const byForceOrder = new Map<
    number,
    {
      items: ScoredNode[]
      branches: ScoredNode[]
    }
  >()

  for (const node of nodes) {
    const forceOrder = getNodeForceOrder(node.node.def, node.score)
    const bucket = byForceOrder.get(forceOrder) ?? {
      items: [],
      branches: [],
    }

    if (
      node.node.kind === 'item' ||
      node.node.kind === 'link-item' ||
      node.node.kind === 'radio-item' ||
      node.node.kind === 'checkbox-item' ||
      node.node.kind === 'tree-item'
    ) {
      bucket.items.push(node)
    } else {
      bucket.branches.push(node)
    }

    byForceOrder.set(forceOrder, bucket)
  }

  const sortedForceOrders = [...byForceOrder.keys()].sort((a, b) => a - b)

  const result: ScoredNode[] = []

  for (const forceOrder of sortedForceOrders) {
    const bucket = byForceOrder.get(forceOrder)
    if (!bucket) {
      continue
    }

    result.push(...bucket.items, ...bucket.branches)
  }

  return result
}

/** Deduplicates scored rows by Resolved ID. A row can reach the flat list twice when a loader result repeats a def already present under the same branch. */
export function deduplicateNodes(nodes: ScoredNode[]): ScoredNode[] {
  const seen = new Set<string>()
  const result: ScoredNode[] = []

  for (const scoredNode of nodes) {
    if (!seen.has(scoredNode.node.id)) {
      seen.add(scoredNode.node.id)
      result.push(scoredNode)
    }
  }

  return result
}

// ============================================================================
