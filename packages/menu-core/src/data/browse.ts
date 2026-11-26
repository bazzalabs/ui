// ============================================================================
// Browse Mode - Get Shallow Nodes
// ============================================================================

import { containerOf } from '../tree/container.js'
import type { AnyMenuNode, MenuNodeOfKind } from '../tree/menu-node.js'
import { displayRowMembership } from './container.js'
import { buildDisplayContainerNode } from './display.js'
import { getSupportedTreeChildren } from './flatten.js'
import {
  isContainerMenuNode,
  isMenuNodeOfKind,
  isRowMenuNode,
} from './type-guards.js'
import type {
  BreadcrumbNode,
  PipelineDisplayNode,
  PipelineDisplayRowNode,
  PipelineDisplayTypes,
  PipelineMenuNode,
  RowMenuNode,
  RowRenderContext,
} from './types.js'

// Browse Mode - Get Shallow Nodes
// ============================================================================

function expandTreeNode<N extends PipelineMenuNode<N>>(
  node: MenuNodeOfKind<N, 'tree-item'>,
  highlightedId: string | null,
  group: { id: string; label?: string } | null,
  depth: number,
  ancestorsLast: boolean[],
  breadcrumbs: BreadcrumbNode<PipelineDisplayTypes<N>>[],
  isLastChild: boolean,
): PipelineDisplayRowNode<N>[] {
  const supportedChildren = getSupportedTreeChildren(node.children).filter(
    (child) => !child.def.hidden,
  )
  const tree = {
    depth,
    hasChildren: supportedChildren.length > 0,
    isLastChild,
    ancestorsLast,
    header: node.def.selectable === false,
  }
  const rows: PipelineDisplayRowNode<N>[] = [
    {
      kind: 'row',
      node,
      context: {
        search: null,
        breadcrumbs,
        isDeepSearchResult: false,
        highlighted: node.def.id === highlightedId,
        disabled: node.def.disabled ?? false,
        group,
        tree,
      },
    },
  ]

  const childBreadcrumb: BreadcrumbNode<PipelineDisplayTypes<N>> = {
    node: node.def,
    menuNode: node,
    value: node.def.value,
    id: node.def.id,
  }
  const childBreadcrumbs = [...breadcrumbs, childBreadcrumb]
  supportedChildren.forEach((child, index) => {
    const childIsLast = index === supportedChildren.length - 1
    if (isMenuNodeOfKind(child, 'tree-item')) {
      rows.push(
        ...expandTreeNode<N>(
          child,
          highlightedId,
          group,
          depth + 1,
          [...ancestorsLast, isLastChild],
          childBreadcrumbs,
          childIsLast,
        ),
      )
      return
    }

    rows.push({
      kind: 'row',
      node: child,
      context: {
        search: null,
        breadcrumbs: childBreadcrumbs,
        isDeepSearchResult: false,
        highlighted: child.def.id === highlightedId,
        disabled: child.def.disabled ?? false,
        group,
        tree: {
          depth: depth + 1,
          hasChildren:
            isMenuNodeOfKind(child, 'submenu') && child.children.length > 0,
          isLastChild: childIsLast,
          ancestorsLast: [...ancestorsLast, isLastChild],
          header: false,
        },
      },
    })
  })
  return rows
}

/**
 * Gets nodes for browse mode (no search) with preserve behavior.
 * Keeps group structure intact, showing group containers with their items.
 */
export function getBrowseNodesPreserve<
  N extends PipelineMenuNode<N> = AnyMenuNode,
>(nodes: readonly N[], highlightedId: string | null): PipelineDisplayNode<N>[] {
  const result: PipelineDisplayNode<N>[] = []

  for (const node of nodes) {
    if (isMenuNodeOfKind(node, 'separator')) {
      // Include separators in browse mode for visual separation
      result.push({ kind: 'separator', node })
      continue
    }

    if (isContainerMenuNode(node)) {
      const container = containerOf(node.def)
      if (!container || container.hidden) continue
      const membership = displayRowMembership(node)
      const rows = node.children.filter(
        (child): child is RowMenuNode<N> =>
          isRowMenuNode(child) && !child.def.hidden,
      )
      const items: PipelineDisplayRowNode<N>[] = []
      for (const child of rows) {
        // Only a group expands tree items; a radio or checkbox group shows one
        // as a plain row that keeps its membership, as search does.
        if (
          container.selection === 'none' &&
          isMenuNodeOfKind(child, 'tree-item')
        ) {
          items.push(
            ...expandTreeNode<N>(
              child,
              highlightedId,
              membership.group,
              0,
              [],
              [],
              child === rows.at(-1),
            ),
          )
          continue
        }

        items.push({
          kind: 'row',
          node: child,
          context: {
            search: null,
            breadcrumbs: [],
            isDeepSearchResult: false,
            highlighted: child.def.id === highlightedId,
            disabled: child.def.disabled ?? false,
            group: membership.group,
            tree: null,
          },
          ...membership.row,
        })
      }

      // A Container shows only while it has rows.
      if (items.length > 0) {
        result.push(
          buildDisplayContainerNode<N>(
            node,
            {
              search: null,
              matchCount: items.length,
              breadcrumbs: [],
              isDeepSearchResult: false,
            },
            items,
            1,
          ),
        )
      }
      continue
    }

    if (!isRowMenuNode(node) || node.def.hidden) {
      continue
    }

    // Ungrouped item/submenu/subpage
    if (isMenuNodeOfKind(node, 'tree-item')) {
      const visibleRowNodes = nodes.filter(
        (sibling) => isRowMenuNode(sibling) && !sibling.def.hidden,
      )
      result.push(
        ...expandTreeNode<N>(
          node,
          highlightedId,
          null,
          0,
          [],
          [],
          node === visibleRowNodes.at(-1),
        ),
      )
      continue
    }

    const context: RowRenderContext<PipelineDisplayTypes<N>> = {
      search: null,
      breadcrumbs: [],
      isDeepSearchResult: false,
      highlighted: node.def.id === highlightedId,
      disabled: node.def.disabled ?? false,
      group: null,
      tree: null,
    }
    result.push({ kind: 'row', node, context })
  }

  return result
}

// ============================================================================
