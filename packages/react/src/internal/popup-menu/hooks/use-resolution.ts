'use client'

import * as React from 'react'
import {
  type AppendLoadedResult,
  appendLoadedDefs,
} from '../data-first/append-loaded.js'
import type { AsyncSubmenuInfo } from '../data-first/async.js'
import { collectAsyncSubmenus } from '../data-first/async.js'
import type {
  AsyncContentMode,
  AsyncLoaderConfig,
  DisabledBranchBehavior,
  NodeDef,
  SubmenuDef,
  SubpageDef,
} from '../data-first/types.js'
import {
  childDefsOf,
  contributesDefinitionPath,
  definitionKeyForDef,
} from '../menu-tree/resolve.js'
import type { MenuTreeResolver } from '../menu-tree/resolver.js'
import type { PopupMenuNode } from '../menu-tree/types.js'
import type { LoaderScope, MenuTreeStore } from '../store/MenuTreeStore.js'

export interface UseResolutionOptions {
  tree: MenuTreeStore
  /** The list's loader scope (its surface's coordinator), if any. */
  scopeId: string | null
  content: NodeDef[]
  asyncContent: AsyncLoaderConfig | undefined
  /** How `asyncContent` rows combine with the static content. @default 'replace' */
  asyncContentMode?: AsyncContentMode
  graftParent: PopupMenuNode | null
  isSubpageSurface: boolean
  isResolutionRoot: boolean
  includeInDeepSearch: boolean | 'trigger-only'
  disabledBranchBehavior?: DisabledBranchBehavior
}

/** A list's part of the Menu Tree. */
export interface TreeSlice {
  /**
   * The Menu Nodes this list renders: `resolver.rootNodes` for the root,
   * `graftParent.children` for a grafted list, and for a subpage surface the
   * subpage branch's children (static prefix plus whatever the subpage's own
   * loader grafted).
   */
  readonly nodes: readonly PopupMenuNode[]
}

export interface ResolutionResult {
  /**
   * A new object whenever the list's nodes change, or its resolution changed
   * a node under them while it rendered (a render-time graft under a branch
   * changes its `children` without changing `nodes`); the same object
   * otherwise. A graft a store update makes comes with a new loader scope,
   * so the list's readers of the coordinator re-render with it.
   */
  slice: TreeSlice
  asyncSubmenus: readonly AsyncSubmenuInfo[]
  /**
   * With `asyncContentMode: 'append'`, the defs that came from local content
   * (at any depth), so the list can keep local rows ahead of loaded ones.
   * `null` in `'replace'` mode.
   */
  localDefs: ReadonlySet<NodeDef> | null
}

type ResolutionInput = Omit<UseResolutionOptions, 'tree' | 'scopeId'> & {
  resolver: MenuTreeResolver
  asyncContentMode: AsyncContentMode
}

/** What one list's resolution keeps between runs. */
interface ResolutionMemo {
  /** The async branches grafted last run, to withdraw the ones that left. */
  branches: Set<PopupMenuNode>
  // The appended list, cached on its two inputs, so re-running hands the
  // resolver the same array (ADR 0002), with the local containers it merged.
  append: {
    local: readonly NodeDef[]
    loaded: readonly NodeDef[]
    result: AppendLoadedResult
    merged: ReadonlySet<NodeDef>
  } | null
  // Local defs' last known Resolved IDs. After a merge the resolver maps the
  // merged copy instead of the original, so this is the fallback for it.
  localIds: WeakMap<NodeDef, string>
  /** The list changed the tree while rendering, and hasn't said so yet. */
  unpublished: boolean
}

interface ResolveOutput {
  changed: boolean
  nodes: readonly PopupMenuNode[]
  /** The defs the list's local rows come from. */
  local: readonly NodeDef[]
  /** The root loader's rows, when they're part of the tree. */
  loaded: readonly NodeDef[] | undefined
  asyncSubmenus: AsyncSubmenuInfo[]
}

function withLoaded(
  input: ResolutionInput,
  memo: ResolutionMemo,
  local: readonly NodeDef[],
  loaded: readonly NodeDef[],
  parent: PopupMenuNode | null,
): readonly NodeDef[] {
  const { resolver } = input
  if (input.asyncContentMode === 'replace') return loaded
  const cached = memo.append
  if (cached?.local === local && cached.loaded === loaded) {
    return cached.result.defs
  }
  const basePath =
    parent && contributesDefinitionPath(parent.def) ? parent.definitionPath : []
  const result = appendLoadedDefs(
    local,
    loaded,
    {
      localId: (def) => {
        const id = resolver.getNodeForDef(def)?.id
        if (id === undefined) return memo.localIds.get(def)
        memo.localIds.set(def, id)
        return id
      },
      loadedId: (def, path, index) => {
        const definitionKey = definitionKeyForDef(def)
        return resolver.getResolvedId({
          def,
          kind: def.kind,
          definitionKey,
          definitionPath: [...path, definitionKey],
          parent,
          children: [],
          depth: parent ? parent.depth + 1 : 0,
          index,
        })
      },
    },
    basePath,
  )
  const merged = new Set<NodeDef>()
  for (const def of result.defs) {
    if (result.localDefs.has(def) && !local.includes(def)) merged.add(def)
  }
  memo.append = { local, loaded, result, merged }
  return result.defs
}

/**
 * Applies a list's content and its loader scope's results to the Menu Tree:
 * the content (with the root loader's rows) at the list's graft point, then
 * each async branch's rows under it. Every target is re-grafted with its
 * current base on every run (static children alone when its loader has no
 * usable result), so a result that disappears is withdrawn; the resolver's
 * reference fast path makes the unchanged cases free.
 */
function resolveList(
  input: ResolutionInput,
  scope: LoaderScope,
  memo: ResolutionMemo,
): ResolveOutput {
  const {
    resolver,
    content,
    asyncContent,
    graftParent,
    isSubpageSurface,
    isResolutionRoot,
  } = input
  let changed = false
  const graft = (parent: PopupMenuNode, defs: readonly NodeDef[]) => {
    const before = parent.children
    resolver.graft(parent, defs)
    changed ||= before !== parent.children
  }
  const branchDefs = (node: PopupMenuNode) =>
    (node.def as SubmenuDef | SubpageDef).nodes ?? []

  const loaded =
    scope.root?.result.data && !scope.rootError
      ? scope.root.result.data
      : undefined
  const withRoot = (
    local: readonly NodeDef[],
    parent: PopupMenuNode | null,
  ): readonly NodeDef[] =>
    loaded
      ? asyncContent
        ? withLoaded(input, memo, local, loaded, parent)
        : [...local, ...loaded]
      : local

  let nodes: readonly PopupMenuNode[] = []
  let local: readonly NodeDef[] = content
  if (isSubpageSurface) {
    // A subpage surface's `content` is (by construction) the branch's
    // already-resolved static children, so its Menu Nodes are looked up
    // rather than created. The branch is the graft point, or the parent of
    // the first static child for callers without one. The subpage's own
    // loader (`asyncContent`) grafts under it with the same rule as a root.
    const staticNodes = content
      .map((def) => resolver.getNodeForDef(def))
      .filter((node): node is PopupMenuNode => node !== undefined)
    const branch = graftParent ?? staticNodes[0]?.parent ?? null
    if (branch) {
      local = branchDefs(branch)
      graft(branch, withRoot(local, branch))
    }
    nodes = branch?.children ?? staticNodes
  } else if (graftParent) {
    graft(graftParent, withRoot(content, graftParent))
    nodes = graftParent.children
  } else if (isResolutionRoot) {
    const before = resolver.rootNodes
    resolver.setContent(withRoot(content, null))
    changed ||= before !== resolver.rootNodes
    nodes = resolver.rootNodes
  }

  // Async branches are collected over static children only, so the grafts
  // below never add one.
  const asyncSubmenus = collectAsyncSubmenus(
    nodes,
    input.includeInDeepSearch,
    true,
    input.disabledBranchBehavior,
  )
  // Branches that left the async set since the last run are restored to
  // their static children, so an unregistered loader's result is withdrawn.
  const branches = new Set<PopupMenuNode>(
    asyncSubmenus.map((info) => info.node as PopupMenuNode),
  )
  for (const node of memo.branches) {
    if (!branches.has(node)) graft(node, branchDefs(node))
  }
  memo.branches = branches
  for (const info of asyncSubmenus) {
    const state = scope.loaders.get(info.id)
    const rows = scope.erroredLoaders.has(info.id)
      ? undefined
      : state?.result.data
    const statics = branchDefs(info.node)
    graft(info.node, rows ? [...statics, ...rows] : statics)
  }

  return {
    changed,
    nodes,
    local,
    loaded,
    asyncSubmenus,
  }
}

export function useResolution({
  tree,
  scopeId,
  content,
  asyncContent,
  asyncContentMode = 'replace',
  graftParent,
  isSubpageSurface,
  isResolutionRoot,
  includeInDeepSearch,
  disabledBranchBehavior,
}: UseResolutionOptions): ResolutionResult {
  const { resolver } = tree
  const scope = tree.useState('loaders', scopeId ?? '')
  const input: ResolutionInput = {
    resolver,
    content,
    asyncContent,
    asyncContentMode,
    graftParent,
    isSubpageSurface,
    isResolutionRoot,
    includeInDeepSearch,
    disabledBranchBehavior,
  }

  const memoRef = React.useRef<ResolutionMemo | null>(null)
  memoRef.current ??= {
    branches: new Set(),
    append: null,
    localIds: new WeakMap(),
    unpublished: false,
  }
  const memo = memoRef.current
  const sliceRef = React.useRef<TreeSlice | null>(null)

  // Static content resolves synchronously in render (ADR-0002), together with
  // the results the scope holds, so a content change never shows a frame
  // without them.
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the resolution inputs and the scope's results (`input` is a new object every render)
  const resolution = React.useMemo(() => {
    const output = resolveList(input, scope, memo)
    if (output.changed) memo.unpublished = true
    let slice = sliceRef.current
    if (!slice || output.changed || slice.nodes !== output.nodes) {
      slice = { nodes: output.nodes }
      sliceRef.current = slice
    }

    // Every def from local content (any depth); merged copies of local
    // containers count as local too.
    let localDefs: Set<NodeDef> | null = null
    if (asyncContentMode === 'append') {
      const { append } = memo
      const defs = new Set(
        append && append.loaded === output.loaded ? append.merged : [],
      )
      const add = (list: readonly NodeDef[]) => {
        for (const def of list) {
          defs.add(def)
          add(childDefsOf(def))
        }
      }
      add(output.local)
      localDefs = defs
    }
    return { slice, asyncSubmenus: output.asyncSubmenus, localDefs }
  }, [
    resolver,
    content,
    asyncContent,
    asyncContentMode,
    graftParent,
    isSubpageSurface,
    isResolutionRoot,
    includeInDeepSearch,
    disabledBranchBehavior,
    scope,
  ])

  // The scope's results reach the tree in the store update that records
  // them: the tree calls this list's resolution with them, from the inputs
  // the list last committed.
  const inputRef = React.useRef(input)
  React.useLayoutEffect(() => {
    inputRef.current = input
    // A change made while rendering reaches the tree's other readers (the
    // subpage outlet) before paint.
    if (memo.unpublished) {
      memo.unpublished = false
      tree.publishResolved()
    }
  })
  React.useLayoutEffect(() => {
    if (scopeId === null) return undefined
    return tree.setGrafter(
      scopeId,
      (next) => resolveList(inputRef.current, next, memo).changed,
    )
  }, [tree, scopeId, memo])

  return resolution
}
