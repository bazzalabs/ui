// ============================================================================
// Flatten Nodes for Search
// ============================================================================

import type { IncludeInDeepSearch } from '../tree/branch-config.js'
import { containerOf } from '../tree/container.js'
import type { AnyMenuNode, MenuNodeOfKind } from '../tree/menu-node.js'
import { resolveBranchIncludeMode } from './async.js'
import {
  type ContainerMembership,
  containerMembership,
  NO_CONTAINER,
} from './container.js'
import {
  isContainerMenuNode,
  isMenuNodeOfKind,
  isRowMenuNode,
} from './type-guards.js'
import type {
  BreadcrumbNode,
  DisabledBranchBehavior,
  FlattenedNode,
  PipelineDisplayTypes,
  PipelineMenuNode,
} from './types.js'

interface FlattenOptions<N extends PipelineMenuNode<N>> {
  /** Whether to include children of branch nodes (submenu/subpage) */
  deep?: boolean
  /** Default include mode for descendant branch nodes */
  includeInDeepSearch?: IncludeInDeepSearch
  /** How descendants of a disabled branch participate. */
  disabledBranchBehavior?: DisabledBranchBehavior
  /** Whether ancestors allow this subtree to participate in deep search */
  descendantsIncluded?: boolean
  /** Parent breadcrumb nodes (branch nodes from root to parent) */
  breadcrumbs?: BreadcrumbNode<PipelineDisplayTypes<N>>[]
  /** The Container the nodes are in (nested Containers are not supported) */
  container?: ContainerMembership<N>
  /** Keywords inherited from tree ancestors. */
  inheritedKeywords?: string[]
}

/** Returns the child kinds supported by v1 inline trees. */
export function getSupportedTreeChildren<
  N extends PipelineMenuNode<N> = AnyMenuNode,
>(
  nodes: readonly N[],
): Array<MenuNodeOfKind<N, 'tree-item' | 'item' | 'submenu'>> {
  const supported: Array<MenuNodeOfKind<N, 'tree-item' | 'item' | 'submenu'>> =
    []
  for (const node of nodes) {
    if (
      isMenuNodeOfKind(node, 'tree-item') ||
      isMenuNodeOfKind(node, 'item') ||
      isMenuNodeOfKind(node, 'submenu')
    ) {
      supported.push(node)
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn(`Unsupported ${node.kind} child skipped inside tree-item.`)
    }
  }
  return supported
}

/**
 * Flattens a tree of Menu Nodes into a flat array.
 * When deep=true, includes children of branch nodes with their breadcrumb paths.
 * Tracks the Container (group, radio group, or checkbox group) each node is in.
 */
export function flattenNodes<N extends PipelineMenuNode<N> = AnyMenuNode>(
  nodes: readonly N[],
  options: FlattenOptions<N> = {},
): FlattenedNode<PipelineDisplayTypes<N>>[] {
  const {
    deep = false,
    includeInDeepSearch = true,
    disabledBranchBehavior = 'exclude',
    descendantsIncluded = true,
    breadcrumbs = [],
    container = NO_CONTAINER,
    inheritedKeywords = [],
  } = options
  const result: FlattenedNode<PipelineDisplayTypes<N>>[] = []

  for (const node of nodes) {
    if (isMenuNodeOfKind(node, 'separator')) {
      // Skip separators during search
      continue
    }

    if (isContainerMenuNode(node)) {
      // Containers recurse into their rows, which carry the Container's
      // membership. Nested Containers are not supported: the inner one wins.
      if (containerOf(node.def)?.hidden) continue
      result.push(
        ...flattenNodes(node.children, {
          deep,
          includeInDeepSearch,
          disabledBranchBehavior,
          descendantsIncluded,
          breadcrumbs,
          container: containerMembership(node),
          inheritedKeywords,
        }),
      )
      continue
    }

    if (!isRowMenuNode(node)) continue

    if (node.def.hidden) {
      continue
    }

    if (
      isMenuNodeOfKind(node, 'item') ||
      isMenuNodeOfKind(node, 'radio-item') ||
      isMenuNodeOfKind(node, 'checkbox-item') ||
      isMenuNodeOfKind(node, 'link-item')
    ) {
      result.push({
        node,
        breadcrumbs,
        ...container,
        inheritedKeywords,
      })
      continue
    }

    if (isMenuNodeOfKind(node, 'tree-item')) {
      if (node.def.selectable !== false) {
        result.push({
          node,
          breadcrumbs,
          ...container,
          inheritedKeywords,
        })
      }

      if (node.children.length && node.def.deepSearch !== false) {
        const treeBreadcrumb: BreadcrumbNode<PipelineDisplayTypes<N>> = {
          node: node.def,
          menuNode: node,
          value: node.def.value,
          id: node.def.id,
        }
        result.push(
          ...flattenNodes(getSupportedTreeChildren(node.children), {
            deep,
            includeInDeepSearch,
            disabledBranchBehavior,
            descendantsIncluded,
            breadcrumbs: [...breadcrumbs, treeBreadcrumb],
            container,
            inheritedKeywords: [...inheritedKeywords, node.def.value],
          }),
        )
      }
      continue
    }

    if (
      isMenuNodeOfKind(node, 'submenu') ||
      isMenuNodeOfKind(node, 'subpage')
    ) {
      const branchIncludeMode = resolveBranchIncludeMode(
        node.def,
        includeInDeepSearch,
        disabledBranchBehavior,
      )

      // includeInDeepSearch only affects deep search results.
      // In shallow mode, branch triggers remain searchable as normal rows.
      const shouldIncludeBranchTrigger =
        !deep || (descendantsIncluded && branchIncludeMode !== false)

      if (shouldIncludeBranchTrigger) {
        result.push({
          node,
          breadcrumbs,
          ...container,
          inheritedKeywords,
        })
      }

      // If deep search enabled and branch allows descendants, include children.
      const shouldIncludeBranchDescendants =
        deep &&
        descendantsIncluded &&
        branchIncludeMode === true &&
        node.def.deepSearch !== false

      if (shouldIncludeBranchDescendants && node.children.length) {
        const branchBreadcrumb: BreadcrumbNode<PipelineDisplayTypes<N>> = {
          node: node.def,
          menuNode: node,
          value: node.def.value,
          id: node.def.id,
        }
        const childBreadcrumbs: BreadcrumbNode<PipelineDisplayTypes<N>>[] = [
          ...breadcrumbs,
          branchBreadcrumb,
        ]

        result.push(
          ...flattenNodes(
            node.children.filter((child) => {
              if (child.kind === 'tree-item') {
                if (process.env.NODE_ENV !== 'production') {
                  console.warn(
                    'Unsupported tree-item child skipped inside submenu/subpage.',
                  )
                }
                return false
              }
              return true
            }),
            {
              deep,
              includeInDeepSearch,
              disabledBranchBehavior,
              descendantsIncluded: true,
              breadcrumbs: childBreadcrumbs,
              // A branch's rows are outside the Container its trigger is in.
              container: NO_CONTAINER,
              inheritedKeywords,
            },
          ),
        )
      }
    }
  }

  return result
}
