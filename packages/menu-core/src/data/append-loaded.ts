import type { AnyNodeDef } from '../tree/node-def-map.js'
import {
  childDefsOf,
  contributesDefinitionPath,
  definitionKeyForDef,
} from '../tree/resolve.js'

// Generic over the framework's def union `D`. A def's `nodes` hold defs of the
// same framework, so every def the body reads as an `AnyNodeDef` is a `D`.
type NodeDef = AnyNodeDef

/** How the menu identifies rows, so duplicates match the Menu Tree exactly. */
export interface AppendLoadedIds<D extends AnyNodeDef = AnyNodeDef> {
  /** The Resolved ID of a local def already resolved into the Menu Tree. */
  localId: (def: D) => string | undefined
  /** The Resolved ID a loaded def will get at this position. */
  loadedId: (def: D, basePath: readonly string[], index: number) => string
}

export interface AppendLoadedResult<D extends AnyNodeDef = AnyNodeDef> {
  /** Local defs first, then the loaded defs that weren't duplicates. */
  defs: D[]
  /**
   * Every def that came from local content, at any depth, including local
   * containers that received loaded children.
   */
  localDefs: ReadonlySet<D>
}

const CONTAINER_KINDS = new Set(['group', 'radio-group', 'checkbox-group'])

/**
 * Appends loaded defs after local ones. A loaded def whose Resolved ID already
 * belongs to a local def is dropped, so local rows win. IDs are compared the
 * way the Menu Tree assigns them (scope and any custom `getResolvedId`
 * included), across every local row, including rows inside branches.
 *
 * A loaded group, radio group or checkbox group that shares its ID with a
 * local one of the same kind at the top level adds its non-duplicate rows to
 * the end of that local container; anywhere else, a colliding container is
 * dropped and its non-duplicate rows take its place. Groups left empty are
 * dropped.
 */
export function appendLoadedDefs<D extends AnyNodeDef = AnyNodeDef>(
  local: readonly D[],
  loaded: readonly D[],
  ids: AppendLoadedIds<D>,
  basePath?: readonly string[],
): AppendLoadedResult<D>
export function appendLoadedDefs(
  local: readonly NodeDef[],
  loaded: readonly NodeDef[],
  ids: AppendLoadedIds,
  basePath: readonly string[] = [],
): AppendLoadedResult {
  const localDefs = new Set<NodeDef>()
  const localIds = new Set<string>()
  const collect = (defs: readonly NodeDef[]) => {
    for (const def of defs) {
      localDefs.add(def)
      const id = ids.localId(def)
      if (id !== undefined) localIds.add(id)
      collect(childDefsOf(def))
    }
  }
  collect(local)

  // Top-level local containers that loaded rows may join, by Resolved ID.
  const mergeTargets = new Map<string, number>()
  local.forEach((def, index) => {
    const id = ids.localId(def)
    if (id !== undefined && CONTAINER_KINDS.has(def.kind)) {
      mergeTargets.set(id, index)
    }
  })
  const merged = new Map<number, NodeDef[]>()

  const keep = (
    defs: readonly NodeDef[],
    path: readonly string[],
    topLevel: boolean,
  ): NodeDef[] =>
    defs.flatMap((def, index): NodeDef[] => {
      // Top-level loaded rows sit after the local rows in the Menu Tree.
      const id = ids.loadedId(
        def,
        path,
        topLevel ? local.length + index : index,
      )
      const childPath = contributesDefinitionPath(def)
        ? [...path, definitionKeyForDef(def)]
        : path

      if (
        def.kind === 'group' ||
        def.kind === 'radio-group' ||
        def.kind === 'checkbox-group'
      ) {
        const nodes = keep(def.nodes, childPath, false)
        if (localIds.has(id)) {
          const target = topLevel ? mergeTargets.get(id) : undefined
          if (target !== undefined && local[target]?.kind === def.kind) {
            merged.set(target, [...(merged.get(target) ?? []), ...nodes])
            return []
          }
          return nodes
        }
        if (nodes.length === 0) return []
        return nodes.length === def.nodes.length &&
          nodes.every((node, i) => node === def.nodes[i])
          ? [def]
          : [{ ...def, nodes } as NodeDef]
      }

      if (localIds.has(id)) return []
      if (def.kind === 'tree-item' && def.nodes) {
        const nodes = keep(def.nodes, childPath, false)
        return nodes.length === def.nodes.length &&
          nodes.every((node, i) => node === def.nodes?.[i])
          ? [def]
          : [{ ...def, nodes } as NodeDef]
      }
      return [def]
    })

  const appended = keep(loaded, basePath, true)
  if (
    merged.size === 0 &&
    appended.length === loaded.length &&
    appended.every((def, i) => def === loaded[i])
  ) {
    return { defs: [...local, ...loaded], localDefs }
  }

  const localWithMerges = local.map((def, index) => {
    const extra = merged.get(index)
    if (!extra || extra.length === 0) return def
    const container = def as Extract<NodeDef, { nodes: NodeDef[] }>
    const next = {
      ...container,
      nodes: [...container.nodes, ...extra],
    } as NodeDef
    localDefs.add(next)
    return next
  })
  return { defs: [...localWithMerges, ...appended], localDefs }
}
