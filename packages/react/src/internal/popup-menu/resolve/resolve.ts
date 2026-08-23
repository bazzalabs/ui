import { slugify } from '../../listbox/utils/normalize.js'
import type { NodeDef } from '../deep-search/types.js'
import type {
  GetRowIdFn,
  PopupMenuNode,
  UnidentifiedMenuNode,
} from './types.js'

/** Default row id: explicit `def.id` verbatim, else the joined definition path. */
export function defaultGetRowId(node: UnidentifiedMenuNode): string {
  return node.def.id ?? node.defPath.join('.')
}

/** Segment for a def: explicit `id` verbatim, else slugified `value`. */
export function segmentForDef(def: NodeDef): string {
  switch (def.kind) {
    case 'group':
    case 'radio-group':
      return def.id
    case 'separator':
      return def.id ?? ''
    default:
      return def.id ?? slugify(def.value)
  }
}

/** Child defs of a def, in def order; empty for leaf kinds. */
export function childDefsOf(def: NodeDef): readonly NodeDef[] {
  switch (def.kind) {
    case 'group':
    case 'radio-group':
      return def.nodes
    case 'submenu':
    case 'subpage':
    case 'tree-item':
      return def.nodes ?? []
    default:
      return []
  }
}

/** Kinds whose segment is part of their descendants' definition paths. */
export function contributesPathSegment(def: NodeDef): boolean {
  return (
    def.kind === 'submenu' || def.kind === 'subpage' || def.kind === 'tree-item'
  )
}

/**
 * Resolve a def list into node instances under `parent`.
 * `basePath` is the path segments contributed by ancestors (the parent's
 * `defPath` when the parent contributes a segment, otherwise the parent's
 * own base path); pass `[]` for roots.
 */
export function resolveNodeDefs(
  defs: readonly NodeDef[],
  parent: PopupMenuNode | null,
  basePath: readonly string[],
  getRowId: GetRowIdFn,
): PopupMenuNode[] {
  return defs.map((def, index) => {
    const segment = segmentForDef(def)
    const defPath = segment ? [...basePath, segment] : [...basePath]
    const unidentified: UnidentifiedMenuNode = {
      def,
      kind: def.kind,
      segment,
      defPath,
      parent,
      children: [],
      depth: parent ? parent.depth + 1 : 0,
      index,
    }
    // Call the seam before spreading so the node reflects any reads the seam
    // performs on the final definitional facts (spread-then-call would copy
    // the fields before the seam runs).
    const id = getRowId(unidentified)
    const node: PopupMenuNode = { ...unidentified, id }
    node.children = resolveNodeDefs(
      childDefsOf(def),
      node,
      contributesPathSegment(def) ? node.defPath : basePath,
      getRowId,
    )
    return node
  })
}
