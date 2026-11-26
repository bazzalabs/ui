import type { AnyNodeDef } from './node-def-map.js'

/**
 * A Menu Node: what the library creates for a node def. It carries identity
 * (Resolved ID, Definition Key, Definition Path), tree links (`parent`,
 * `children`), and a reference to its originating def. There is exactly one
 * per logical row per menu root, in every render context, so object identity
 * is Resolved ID identity, and `id` is its serialization. Resolution at the
 * root or grafting creates it, and it stays the same object when content is
 * re-supplied (reconciliation swaps `def` in place).
 *
 * `D` narrows `def`/`kind` for callers that know the def kind statically.
 * Narrowing is a lookup-time snapshot: reconciliation may replace `def` in
 * place with another def of the same Resolved ID, so a long-held narrowed
 * reference sees the current def, not necessarily the one it was looked up
 * with. `N` is the node type `parent` and `children` hold, so a framework's
 * Menu Node links to Menu Nodes of its own type.
 */
export interface MenuNode<D extends { kind: string }, N> {
  /** The originating def. Replaced in place when content is re-supplied. */
  def: D
  /** Mirror of `def.kind`, stable for the node's lifetime. */
  kind: D['kind']
  /**
   * This node's path component: explicit `def.id` verbatim when present,
   * otherwise the slugified `value` (kinds without a display value use
   * their required `id`).
   */
  definitionKey: string
  /**
   * Definition Path: Definition Keys from the menu root to this node,
   * including its own key, root-first. Only submenu and subpage ancestors
   * contribute keys (groups, radio-groups, checkbox-groups, and tree-items are path-transparent).
   */
  definitionPath: string[]
  /** Resolved ID selected by the root's identity policy. */
  id: string
  parent: N | null
  children: N[]
  /** Def-tree depth counting every node kind; roots are 0. */
  depth: number
  /** Sibling index in the def tree (position within `parent.children`). */
  index: number
}

/**
 * The facts of a Menu Node before its Resolved ID is assigned: the argument
 * to `getResolvedId`. Carries definitional facts only (`def`,
 * `definitionKey`, `definitionPath`, `parent`, `depth`, def-tree sibling
 * `index`). Contextual facts (search state, deep-search flags, display
 * position) are deliberately absent: a context-dependent Resolved ID is
 * inexpressible by construction.
 */
export type UnresolvedMenuNode<N extends { id: string }> = Omit<N, 'id'>

/**
 * A Menu Node of any framework's defs: what the Menu Tree and the data
 * pipeline resolve to when no framework supplies its own Menu Node type.
 */
export interface AnyMenuNode<D extends AnyNodeDef = AnyNodeDef>
  extends MenuNode<D, AnyMenuNode> {}

/**
 * A framework's Menu Node `N` narrowed to the defs of kind `K`, as a kind
 * guard narrows it: `def` is the framework's def of that kind.
 */
export type MenuNodeOfKind<
  N extends { def: AnyNodeDef },
  K extends AnyNodeDef['kind'],
> = N & { def: N['def'] & { kind: K }; kind: K }

/**
 * Where a Definition Key must be unique: across the whole menu root
 * (`'menu'`) or within each surface (`'surface'`).
 */
export type MenuIdScope = 'menu' | 'surface'

/**
 * Computes a node's Resolved ID from definitional facts. The ID must be unique
 * per menu root; it is the identity persistent state, registration, and
 * highlight key off.
 *
 * Contract: the id may read the node's own facts (including its own sibling
 * `index`) and may walk `parent` for lineage (as the default definition-path
 * rule does), but it must not depend on an *ancestor's* sibling `index`:
 * reconciliation invalidates ids by def identity and definition path, not by
 * ancestor reordering, so ancestor-index-dependent ids would go stale. The
 * seam must also not mutate its argument.
 */
export type GetResolvedIdFn<N extends { id: string }> = (
  node: UnresolvedMenuNode<N>,
) => string
