'use client'

import * as React from 'react'
import {
  type AppendLoadedResult,
  appendLoadedDefs,
} from '../data-first/append-loaded.js'
import type { AsyncSubmenuInfo } from '../data-first/async.js'
import { collectAsyncSubmenus } from '../data-first/async.js'
import type { AsyncMenuCoordinatorValue } from '../data-first/async-coordinator.js'
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

export interface UseResolutionOptions {
  resolver: MenuTreeResolver | null
  content: NodeDef[]
  asyncContent: AsyncLoaderConfig | undefined
  /** How `asyncContent` rows combine with the static content. @default 'replace' */
  asyncContentMode?: AsyncContentMode
  coordinator: AsyncMenuCoordinatorValue | null
  graftParent: PopupMenuNode | null
  isSubpageSurface: boolean
  isResolutionRoot: boolean
  includeInDeepSearch: boolean | 'trigger-only'
  disabledBranchBehavior?: DisabledBranchBehavior
}

export interface ResolutionResult {
  /**
   * The Menu Nodes this list renders: `resolver.rootNodes` for the root,
   * `graftParent.children` for a grafted list, and for a subpage surface the
   * subpage branch's children (static prefix plus whatever the subpage's own
   * loader grafted). Reference-stable across renders when nothing changed.
   */
  nodes: readonly PopupMenuNode[]
  /** Increments once per loader-effect run that grafted anything anywhere in this list's subtree. */
  graftVersion: number
  asyncSubmenus: readonly AsyncSubmenuInfo[]
  /**
   * With `asyncContentMode: 'append'`, the defs that came from local content
   * (at any depth), so the list can keep local rows ahead of loaded ones.
   * `null` in `'replace'` mode or before anything was appended.
   */
  localDefs: ReadonlySet<NodeDef> | null
}

export function useResolution({
  resolver,
  content,
  asyncContent,
  asyncContentMode = 'replace',
  coordinator,
  graftParent,
  isSubpageSurface,
  isResolutionRoot,
  includeInDeepSearch,
  disabledBranchBehavior,
}: UseResolutionOptions): ResolutionResult {
  React.useMemo(() => {
    if (!resolver || isSubpageSurface) return
    if (graftParent) resolver.graft(graftParent, content)
    else if (isResolutionRoot) resolver.setContent(content)
  }, [resolver, content, graftParent, isSubpageSurface, isResolutionRoot])

  // A subpage surface never feeds resolution: its `content` is (by
  // construction) the branch's already-resolved static children, so its Menu
  // Nodes are looked up rather than created. The branch is their parent, or
  // the graft point when the subpage has no static content.
  const subpageStaticNodes = React.useMemo(
    () =>
      isSubpageSurface && resolver
        ? content
            .map((def) => resolver.getNodeForDef(def))
            .filter((node): node is PopupMenuNode => node !== undefined)
        : [],
    [isSubpageSurface, resolver, content],
  )
  // The graft point (the subpage Menu Node itself) is authoritative; the
  // parent of the first static child is the fallback for callers without one.
  const subpageBranch = isSubpageSurface
    ? (graftParent ?? subpageStaticNodes[0]?.parent ?? null)
    : null

  // Read after the static phase so a `content` change is visible in the
  // same render (the static phase can replace `rootNodes` / `children`).
  const [graftVersion, setGraftVersion] = React.useState(0)
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on `content` and `graftVersion` (the resolution inputs), not on resolver fields
  const staticNodes = React.useMemo(
    () =>
      isSubpageSurface
        ? (subpageBranch?.children ?? subpageStaticNodes)
        : graftParent
          ? graftParent.children
          : isResolutionRoot && resolver
            ? resolver.rootNodes
            : [],
    [
      isSubpageSurface,
      subpageBranch,
      subpageStaticNodes,
      graftParent,
      resolver,
      isResolutionRoot,
      content,
      graftVersion,
    ],
  )
  const asyncSubmenus = React.useMemo(
    () =>
      collectAsyncSubmenus(
        staticNodes,
        includeInDeepSearch,
        true,
        disabledBranchBehavior,
      ),
    [staticNodes, includeInDeepSearch, disabledBranchBehavior],
  )

  // Cache the appended list on its two inputs, so re-running the loader phase
  // with the same content and result hands resolution the same array (ADR 0002).
  const appendCacheRef = React.useRef<{
    local: readonly NodeDef[]
    loaded: readonly NodeDef[]
    result: AppendLoadedResult
  } | null>(null)
  // Local defs' last known Resolved IDs. After a merge the resolver maps the
  // merged copy instead of the original, so this is the fallback for it.
  const localIdsRef = React.useRef(new WeakMap<NodeDef, string>())
  // Local containers replaced by merged copies that include loaded rows.
  const [mergedLocalDefs, setMergedLocalDefs] = React.useState<
    ReadonlySet<NodeDef>
  >(() => new Set())
  const withLoaded = (
    local: readonly NodeDef[],
    loaded: readonly NodeDef[],
    parent: PopupMenuNode | null,
  ) => {
    if (asyncContentMode === 'replace' || !resolver) return loaded
    const cached = appendCacheRef.current
    if (cached?.local === local && cached.loaded === loaded) {
      return cached.result.defs
    }
    const basePath =
      parent && contributesDefinitionPath(parent.def)
        ? parent.definitionPath
        : []
    const result = appendLoadedDefs(
      local,
      loaded,
      {
        localId: (def) => {
          const id = resolver.getNodeForDef(def)?.id
          if (id === undefined) return localIdsRef.current.get(def)
          localIdsRef.current.set(def, id)
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
    appendCacheRef.current = { local, loaded, result }
    const merged = new Set<NodeDef>()
    for (const def of result.defs) {
      if (result.localDefs.has(def) && !local.includes(def)) merged.add(def)
    }
    setMergedLocalDefs((current) =>
      current.size === 0 && merged.size === 0 ? current : merged,
    )
    return result.defs
  }

  const previousBranchesRef = React.useRef<Set<PopupMenuNode>>(new Set())
  // biome-ignore lint/correctness/useExhaustiveDependencies: ADR-0002 — the loader phase is keyed on the coordinator's loader map (the true input), not the coordinator object or its stable callbacks
  React.useEffect(() => {
    if (!resolver || !coordinator) return
    if (isSubpageSurface && !subpageBranch) return
    // Every target is re-grafted with its current base on every run — static
    // children alone when its loader has no usable result — so a result that
    // disappears (pending again, errored, unregistered) is withdrawn from the
    // Menu Tree. The resolver's reference fast path and structural
    // short-circuit make the unchanged cases free.
    const results = new Map(
      coordinator
        .getAsyncNodes()
        .filter(
          (entry): entry is { kind: 'branch'; id: string; nodes: NodeDef[] } =>
            entry.kind === 'branch',
        )
        .map((entry) => [entry.id, entry.nodes]),
    )
    let changed = false
    const graft = (parent: PopupMenuNode | null, defs: readonly NodeDef[]) => {
      if (!parent) return
      const before = parent.children
      resolver.graft(parent, defs)
      changed ||= before !== parent.children
    }

    const rootResult = coordinator
      .getAsyncNodes()
      .find((entry) => entry.kind === 'root')?.nodes
    if (isSubpageSurface && subpageBranch) {
      // The subpage's own loader (`asyncContent`) grafts under its branch with
      // the same replace/append rule as a root list.
      const staticChildren =
        (subpageBranch.def as SubmenuDef | SubpageDef).nodes ?? []
      graft(
        subpageBranch,
        rootResult
          ? asyncContent
            ? withLoaded(staticChildren, rootResult, subpageBranch)
            : [...staticChildren, ...rootResult]
          : staticChildren,
      )
    } else {
      const base = rootResult
        ? asyncContent
          ? withLoaded(content, rootResult, graftParent)
          : [...content, ...rootResult]
        : content
      if (graftParent) graft(graftParent, base)
      else if (isResolutionRoot) {
        const before = resolver.rootNodes
        resolver.setContent(base)
        changed ||= before !== resolver.rootNodes
      }
    }

    // Branches that left the async set since the last run are restored to
    // their static children so an unregistered loader's result is withdrawn.
    const current = new Set<PopupMenuNode>(
      asyncSubmenus.map((info) => info.node as PopupMenuNode),
    )
    for (const node of previousBranchesRef.current) {
      if (current.has(node)) continue
      graft(node, (node.def as SubmenuDef | SubpageDef).nodes ?? [])
    }
    previousBranchesRef.current = current

    for (const info of asyncSubmenus) {
      const loaded = results.get(info.id)
      const staticChildren = info.node.def.nodes ?? []
      graft(info.node, loaded ? [...staticChildren, ...loaded] : staticChildren)
    }
    if (changed) setGraftVersion((version) => version + 1)
  }, [
    resolver,
    coordinator?.loaders,
    coordinator?.erroredLoaders,
    coordinator?.root,
    content,
    asyncContent,
    asyncContentMode,
    asyncSubmenus,
    graftParent,
    isSubpageSurface,
    subpageBranch,
    isResolutionRoot,
  ])

  // Read after the static phase so a `content` change is visible in the same
  // render; `graftVersion` is the change signal for grafts under branch nodes,
  // which mutate `children` without changing the outer array identity.
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the resolution inputs (content, graftVersion), not on resolver fields
  const nodes = React.useMemo(
    () =>
      isSubpageSurface
        ? (subpageBranch?.children ?? subpageStaticNodes)
        : graftParent
          ? graftParent.children
          : isResolutionRoot && resolver
            ? resolver.rootNodes
            : [],
    [
      isSubpageSurface,
      subpageBranch,
      subpageStaticNodes,
      graftParent,
      resolver,
      isResolutionRoot,
      content,
      graftVersion,
    ],
  )
  // Every def from local content (any depth), known from the first render;
  // merged copies of local containers count as local too.
  const localDefs = React.useMemo(() => {
    if (asyncContentMode !== 'append') return null
    const defs = new Set<NodeDef>(mergedLocalDefs)
    const collect = (list: readonly NodeDef[]) => {
      for (const def of list) {
        defs.add(def)
        collect(childDefsOf(def))
      }
    }
    collect(
      isSubpageSurface && subpageBranch
        ? ((subpageBranch.def as SubmenuDef | SubpageDef).nodes ?? [])
        : content,
    )
    return defs
  }, [
    asyncContentMode,
    mergedLocalDefs,
    content,
    isSubpageSurface,
    subpageBranch,
  ])

  return {
    nodes,
    graftVersion,
    asyncSubmenus,
    localDefs,
  }
}
