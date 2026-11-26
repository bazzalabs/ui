// ============================================================================
// Browse Mode - Get Shallow Nodes
// ============================================================================

import type { AnyMenuNode, MenuNodeOfKind } from '../tree/menu-node.js'
import { getSupportedTreeChildren } from './flatten.js'
import { isMenuNodeOfKind, isRowMenuNode } from './type-guards.js'
import type {
  BreadcrumbNode,
  GroupRenderContext,
  PipelineDisplayNode,
  PipelineDisplayRowNode,
  PipelineDisplayTypes,
  PipelineMenuNode,
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

    if (isMenuNodeOfKind(node, 'group')) {
      // Build group items
      const groupItems: PipelineDisplayRowNode<N>[] = []
      const visibleGroupChildren = node.children.filter(
        (child) => isRowMenuNode(child) && !child.def.hidden,
      )
      for (const child of node.children) {
        // Skip non-row nodes
        if (
          isMenuNodeOfKind(child, 'separator') ||
          isMenuNodeOfKind(child, 'group') ||
          isMenuNodeOfKind(child, 'radio-group') ||
          isMenuNodeOfKind(child, 'checkbox-group')
        ) {
          continue
        }
        if (!isRowMenuNode(child) || child.def.hidden) continue

        if (isMenuNodeOfKind(child, 'tree-item')) {
          groupItems.push(
            ...expandTreeNode<N>(
              child,
              highlightedId,
              { id: node.def.id, label: node.def.label },
              0,
              [],
              [],
              child === visibleGroupChildren.at(-1),
            ),
          )
          continue
        }

        const itemContext: RowRenderContext<PipelineDisplayTypes<N>> = {
          search: null,
          breadcrumbs: [],
          isDeepSearchResult: false,
          highlighted: child.def.id === highlightedId,
          disabled: child.def.disabled ?? false,
          group: { id: node.def.id, label: node.def.label },
          tree: null,
        }

        groupItems.push({
          kind: 'row',
          node: child,
          context: itemContext,
        })
      }

      // Only include group if it has items
      if (groupItems.length > 0) {
        const groupContext: GroupRenderContext<PipelineDisplayTypes<N>> = {
          search: null,
          matchCount: groupItems.length,
          breadcrumbs: [],
          isDeepSearchResult: false,
        }

        result.push({
          kind: 'group',
          node,
          context: groupContext,
          items: groupItems,
          bestScore: 1,
        })
      }
      continue
    }

    if (isMenuNodeOfKind(node, 'radio-group')) {
      if (node.def.hidden) continue

      // Build radio group items
      const radioItems: PipelineDisplayRowNode<N>[] = []
      for (const child of node.children) {
        // RadioGroupDef.nodes only contains ItemDef | SubmenuDef | CheckboxItemDef
        if (!isRowMenuNode(child) || child.def.hidden) continue

        const itemContext: RowRenderContext<PipelineDisplayTypes<N>> = {
          search: null,
          breadcrumbs: [],
          isDeepSearchResult: false,
          highlighted: child.def.id === highlightedId,
          disabled: child.def.disabled ?? false,
          group: null, // Radio items don't belong to a regular group
          tree: null,
        }

        radioItems.push({
          kind: 'row',
          node: child,
          context: itemContext,
          radioGroup: { id: node.def.id, label: node.def.label },
        })
      }

      // Only include radio group if it has items
      if (radioItems.length > 0) {
        const groupContext: GroupRenderContext<PipelineDisplayTypes<N>> = {
          search: null,
          matchCount: radioItems.length,
          breadcrumbs: [],
          isDeepSearchResult: false,
        }

        result.push({
          kind: 'radio-group',
          node,
          context: groupContext,
          items: radioItems,
          bestScore: 1,
        })
      }
      continue
    }

    if (isMenuNodeOfKind(node, 'checkbox-group')) {
      if (node.def.hidden) continue
      const items: PipelineDisplayRowNode<N>[] = []
      for (const child of node.children) {
        if (!isRowMenuNode(child) || child.def.hidden) continue
        items.push({
          kind: 'row',
          node: child,
          context: {
            search: null,
            breadcrumbs: [],
            isDeepSearchResult: false,
            highlighted: child.def.id === highlightedId,
            disabled: child.def.disabled ?? false,
            group: null,
            tree: null,
          },
          checkboxGroup: {
            id: node.def.id,
            label: node.def.label,
            def: node.def,
          },
        })
      }
      if (items.length > 0)
        result.push({
          kind: 'checkbox-group',
          node,
          context: {
            search: null,
            matchCount: items.length,
            breadcrumbs: [],
            isDeepSearchResult: false,
          },
          items,
          bestScore: 1,
        })
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
