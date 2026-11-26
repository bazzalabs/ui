// ============================================================================
// Async Node Collection & Merging
// ============================================================================

import type {
  AsyncNodesConfigBase,
  IncludeInDeepSearch,
} from '../tree/branch-config.js'
import type { AnyMenuNode } from '../tree/menu-node.js'
import { staticChildrenOf } from '../tree/resolve.js'
import type {
  BranchMenuNode,
  DisabledBranchBehavior,
  PipelineMenuNode,
} from './types.js'

// Async Node Collection & Merging
// ============================================================================

/**
 * Info about an async branch node (submenu/subpage) for registration.
 */
export interface AsyncSubmenuInfo<N extends PipelineMenuNode<N> = AnyMenuNode> {
  /** The branch's Resolved ID — the loader key. */
  id: string
  /** The branch Menu Node (graft target and async-state key). */
  node: BranchMenuNode<N>
  /** The async configuration */
  config: AsyncNodesOf<BranchMenuNode<N>['def']>
}

/** The `asyncNodes` config type a framework's branch def `D` takes. */
export type AsyncNodesOf<D> = D extends { asyncNodes?: infer A }
  ? NonNullable<A>
  : never

/**
 * Collects all async branch nodes from a node tree.
 * Recursively traverses groups and branches to find all async configurations.
 */
function collectAsyncSubmenusRaw<N extends PipelineMenuNode<N>>(
  nodes: readonly N[],
  includeInDeepSearch: IncludeInDeepSearch = true,
  descendantsIncluded = true,
  disabledBranchBehavior: DisabledBranchBehavior = 'exclude',
): AsyncSubmenuInfo<N>[] {
  const result: AsyncSubmenuInfo<N>[] = []

  for (const node of nodes) {
    if (node.def.kind === 'separator') {
      continue
    }

    if (node.def.kind === 'group') {
      // Recurse into groups
      result.push(
        ...collectAsyncSubmenusRaw(
          staticChildrenOf(node),
          includeInDeepSearch,
          descendantsIncluded,
          disabledBranchBehavior,
        ),
      )
      continue
    }

    if (node.def.kind === 'radio-group') {
      if (node.def.hidden) continue
      // Recurse into radio groups
      result.push(
        ...collectAsyncSubmenusRaw(
          staticChildrenOf(node),
          includeInDeepSearch,
          descendantsIncluded,
          disabledBranchBehavior,
        ),
      )
      continue
    }

    if (node.def.kind === 'checkbox-group') {
      if (node.def.hidden) continue
      result.push(
        ...collectAsyncSubmenusRaw(
          staticChildrenOf(node),
          includeInDeepSearch,
          descendantsIncluded,
          disabledBranchBehavior,
        ),
      )
      continue
    }

    if (node.def.kind === 'submenu' || node.def.kind === 'subpage') {
      if (node.def.hidden) continue

      const branchIncludeMode = resolveBranchIncludeMode(
        node.def,
        includeInDeepSearch,
        disabledBranchBehavior,
      )
      const shouldIncludeBranchDescendants =
        descendantsIncluded &&
        branchIncludeMode === true &&
        node.def.deepSearch !== false

      // If this branch has async nodes, add it to the result
      if (node.def.asyncNodes && shouldIncludeBranchDescendants) {
        result.push({
          id: node.id,
          node: node as BranchMenuNode<N>,
          // `node` is a branch of `N`, so its config is `N`'s config type.
          config: node.def
            .asyncNodes as unknown as AsyncSubmenuInfo<N>['config'],
        })
      }

      // Recurse into branch node's static nodes
      if (shouldIncludeBranchDescendants) {
        result.push(
          ...collectAsyncSubmenusRaw(
            staticChildrenOf(node),
            includeInDeepSearch,
            true,
            disabledBranchBehavior,
          ),
        )
      }
    }
  }

  return result
}

/**
 * Resolves a branch's deep search inclusion mode. An explicit
 * `includeInDeepSearch` on the def always wins; otherwise a disabled branch
 * under `disabledBranchBehavior: 'exclude'` is treated as `'trigger-only'`,
 * and every other branch takes the surface default.
 */
export function resolveBranchIncludeMode(
  def: { includeInDeepSearch?: IncludeInDeepSearch; disabled?: boolean },
  surfaceDefault: IncludeInDeepSearch,
  disabledBranchBehavior: DisabledBranchBehavior = 'exclude',
): IncludeInDeepSearch {
  if (def.includeInDeepSearch !== undefined) return def.includeInDeepSearch
  if (def.disabled && disabledBranchBehavior === 'exclude')
    return 'trigger-only'
  return surfaceDefault
}

/**
 * Checks if an async loader should be rendered eagerly.
 * Eager loaders mount when the root menu opens (before their submenu is opened).
 */
export function shouldLoadEagerly(config: AsyncNodesConfigBase): boolean {
  if (config.type === 'query') {
    const initialLoadWhen =
      config.initialQueryBehavior === false
        ? 'needed'
        : (config.initialQueryBehavior?.loadWhen ?? 'needed')

    if (initialLoadWhen === 'parent-open') {
      return true
    }
  }

  // Both static and query loaders can still opt into legacy eager strategy.
  return config.loadStrategy === 'eager'
}

/**
 * Collects all async branch nodes from a Menu Node tree, one entry per
 * Resolved ID. Recursively traverses groups and branches (static children
 * only) to find every async configuration. A loader result that repeats an
 * authored branch def yields the same Resolved ID and is collapsed.
 */
export function collectAsyncSubmenus<
  N extends PipelineMenuNode<N> = AnyMenuNode,
>(
  nodes: readonly N[],
  includeInDeepSearch: IncludeInDeepSearch = true,
  descendantsIncluded = true,
  disabledBranchBehavior: DisabledBranchBehavior = 'exclude',
): AsyncSubmenuInfo<N>[] {
  const seen = new Set<string>()
  const result: AsyncSubmenuInfo<N>[] = []
  for (const info of collectAsyncSubmenusRaw(
    nodes,
    includeInDeepSearch,
    descendantsIncluded,
    disabledBranchBehavior,
  )) {
    if (seen.has(info.id)) continue
    seen.add(info.id)
    result.push(info)
  }
  return result
}
