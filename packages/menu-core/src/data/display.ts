// ============================================================================
// Build Display Nodes
// ============================================================================

import type { AnyMenuNode } from '../tree/menu-node.js'
import { displayRowMembership, rowContainerOf } from './container.js'
import type {
  BreadcrumbNode,
  ContainerMenuNode,
  GroupRenderContext,
  PipelineDisplayNode,
  PipelineDisplayRowNode,
  PipelineDisplayTypes,
  PipelineMenuNode,
  RowRenderContext,
  ScoredNode,
} from './types.js'

// Build Display Nodes
// ============================================================================

/**
 * A row is disabled if its own def says so, or if any submenu/subpage
 * ancestor it was reached through (its breadcrumbs) is disabled.
 * Tree-item ancestors are intentionally excluded: browse mode renders tree
 * children with their own `disabled` regardless of the parent (`browse.ts`),
 * and deep search must match browse.
 */
export function resolveRowDisabled<N extends PipelineMenuNode<N> = AnyMenuNode>(
  def: { disabled?: boolean },
  breadcrumbs: BreadcrumbNode<PipelineDisplayTypes<N>>[],
): boolean {
  if (def.disabled) return true
  return breadcrumbs.some(
    (crumb) => crumb.node.kind !== 'tree-item' && crumb.node.disabled === true,
  )
}

/**
 * Converts scored nodes to display row nodes with render context.
 * Used for flatten mode where groups are invisible.
 */
export function buildDisplayRowNodes<
  N extends PipelineMenuNode<N> = AnyMenuNode,
>(
  scoredNodes: ScoredNode<PipelineDisplayTypes<N>>[],
  query: string,
  highlightedId: string | null,
): PipelineDisplayRowNode<N>[] {
  return scoredNodes.map((scoredNode) =>
    buildDisplayRowNode(scoredNode, query, highlightedId),
  )
}

/**
 * Builds a single DisplayRowNode from a ScoredNode.
 * Helper function for building row nodes.
 */
export function buildDisplayRowNode<
  N extends PipelineMenuNode<N> = AnyMenuNode,
>(
  scoredNode: ScoredNode<PipelineDisplayTypes<N>>,
  query: string,
  highlightedId: string | null,
): PipelineDisplayRowNode<N> {
  const isDeepSearchResult = scoredNode.breadcrumbs.length > 0
  const membership = displayRowMembership(rowContainerOf(scoredNode))

  const context: RowRenderContext<PipelineDisplayTypes<N>> = {
    search: query
      ? {
          query,
          score: scoredNode.score,
        }
      : null,
    breadcrumbs: scoredNode.breadcrumbs,
    isDeepSearchResult,
    highlighted: scoredNode.node.def.id === highlightedId,
    disabled: resolveRowDisabled(scoredNode.node.def, scoredNode.breadcrumbs),
    group: membership.group,
    tree: null,
  }

  return {
    kind: 'row',
    node: scoredNode.node,
    context,
    radioGroup: membership.row.radioGroup,
    checkboxGroup: membership.row.checkboxGroup,
  }
}

/**
 * Builds a Container's Display Node. Its `kind` is the Container's def kind,
 * so a group, radio group, or checkbox group renders as the kind it was
 * authored as.
 */
export function buildDisplayContainerNode<N extends PipelineMenuNode<N>>(
  node: ContainerMenuNode<N>,
  context: GroupRenderContext<PipelineDisplayTypes<N>>,
  items: PipelineDisplayRowNode<N>[],
  bestScore: number,
): PipelineDisplayNode<N> {
  return {
    kind: node.def.kind,
    node,
    context,
    items,
    bestScore,
  } as PipelineDisplayNode<N>
}

// ============================================================================
