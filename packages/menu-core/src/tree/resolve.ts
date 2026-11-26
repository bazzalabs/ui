import { slugify } from '../text/normalize.js'
import type {
  AnyMenuNode,
  GetResolvedIdFn,
  MenuIdScope,
  MenuNode,
  UnresolvedMenuNode,
} from './menu-node.js'
import type { AnyNodeDef } from './node-def-map.js'

// The Menu Tree's resolution functions are generic over the framework's Menu
// Node `N`. Resolution creates the nodes, so `N` carries the Menu Node fields
// and nothing else.

/** The defs a def of type `D` holds as children (`nodes`). */
export type ChildNodeDef<D> = D extends { nodes?: readonly (infer C)[] }
  ? 'nodes' extends keyof D
    ? C
    : never
  : never

export function isMenuNode<N extends MenuNode<AnyNodeDef, N> = AnyMenuNode>(
  value: unknown,
): value is N {
  return (
    typeof value === 'object' &&
    value !== null &&
    'def' in value &&
    typeof (value as N).id === 'string' &&
    typeof (value as N).definitionKey === 'string' &&
    Array.isArray((value as N).definitionPath) &&
    Array.isArray((value as N).children) &&
    typeof (value as N).depth === 'number' &&
    'parent' in value
  )
}

function encodeDefinitionPathEntry(entry: string): string {
  let encoded = ''
  for (let index = 0; index < entry.length; index += 1) {
    const codeUnit = entry.charCodeAt(index)
    const isSafe =
      (codeUnit >= 0x41 && codeUnit <= 0x5a) ||
      (codeUnit >= 0x61 && codeUnit <= 0x7a) ||
      (codeUnit >= 0x30 && codeUnit <= 0x39) ||
      codeUnit === 0x2e ||
      codeUnit === 0x5f ||
      codeUnit === 0x7e ||
      codeUnit === 0x2d
    encoded += isSafe
      ? String.fromCharCode(codeUnit)
      : `%${codeUnit.toString(16).padStart(4, '0')}`
  }
  return encoded
}

/** Default Resolved ID, using surface-scoped encoded paths unless menu scope is selected. */
export function defaultGetResolvedId(
  node: { definitionKey: string; definitionPath: readonly string[] },
  idScope: MenuIdScope = 'surface',
): string {
  if (idScope === 'menu') return node.definitionKey
  return node.definitionPath.map(encodeDefinitionPathEntry).join('/')
}

/** Definition Key for a def: explicit `id` verbatim, else slugified `value`. */
export function definitionKeyForDef(def: AnyNodeDef): string {
  switch (def.kind) {
    case 'group':
    case 'radio-group':
    case 'checkbox-group':
      return def.id
    case 'separator':
      return def.id
    default:
      return def.id ?? slugify(def.value)
  }
}

/** Child defs of a def, in def order; empty for leaf kinds. */
export function childDefsOf<D extends AnyNodeDef>(
  def: D,
): readonly ChildNodeDef<D>[] {
  // A def's `nodes` hold its framework's child defs.
  type Children = readonly ChildNodeDef<D>[]
  switch (def.kind) {
    case 'group':
    case 'radio-group':
    case 'checkbox-group':
      return def.nodes as unknown as Children
    case 'submenu':
    case 'subpage':
    case 'tree-item':
      return (def.nodes ?? []) as unknown as Children
    default:
      return []
  }
}

/** Kinds whose Definition Key is part of their descendants' definition paths. */
export function contributesDefinitionPath(def: AnyNodeDef): boolean {
  return def.kind === 'submenu' || def.kind === 'subpage'
}

/**
 * Resolve a def list into node instances under `parent`.
 * `basePath` is the path segments contributed by ancestors (the parent's
 * `definitionPath` when the parent contributes a segment, otherwise the parent's
 * own base path); pass `[]` for roots.
 */
export function resolveNodeDefs<
  N extends MenuNode<AnyNodeDef, N> = AnyMenuNode,
>(
  defs: readonly N['def'][],
  parent: NoInfer<N> | null,
  basePath: readonly string[],
  getResolvedId: NoInfer<GetResolvedIdFn<N>>,
): N[] {
  return defs.map((def, index) => {
    const definitionKey = definitionKeyForDef(def)
    const definitionPath = [...basePath, definitionKey]
    const unresolved = {
      def,
      kind: def.kind,
      definitionKey,
      definitionPath,
      parent,
      children: [],
      depth: parent ? parent.depth + 1 : 0,
      index,
    } as unknown as UnresolvedMenuNode<N>
    // Call the seam before spreading so the node reflects any reads the seam
    // performs on the final definitional facts (spread-then-call would copy
    // the fields before the seam runs).
    const id = getResolvedId(unresolved)
    const node = { ...unresolved, id } as N
    node.children = resolveNodeDefs<N>(
      childDefsOf(def) as readonly N['def'][],
      node,
      contributesDefinitionPath(def) ? node.definitionPath : basePath,
      getResolvedId,
    )
    return node
  })
}

/**
 * The branch's resolved static children: the Menu Nodes whose def is one of
 * the branch def's authored `nodes`, in `children` order. Loader results are
 * grafted as children too but are never in `def.nodes`, so they are excluded
 * whether the graft appended to or replaced the static children.
 */
export function staticChildrenOf<
  N extends MenuNode<AnyNodeDef, N> = AnyMenuNode,
>(branch: N): N[] {
  const authored = (branch.def as { nodes?: readonly AnyNodeDef[] }).nodes
  if (!authored || authored.length === 0) return []
  const authoredSet = new Set<AnyNodeDef>(authored)
  return branch.children.filter((child) => authoredSet.has(child.def))
}
