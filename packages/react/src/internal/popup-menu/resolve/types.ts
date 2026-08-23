import type { NodeDef } from '../deep-search/types.js'

/**
 * A menu node: the library-created, resolved instance of a node def.
 * Exactly one per logical row per menu root, in every render context —
 * object identity is row identity, and `id` is its serialization.
 * Created by resolution at the root or by grafting; instances are stable
 * across content re-supplies (reconciliation swaps `def` in place).
 */
export interface PopupMenuNode {
  /** The originating def. Replaced in place when content is re-supplied. */
  def: NodeDef
  /** Mirror of `def.kind`, stable for the node's lifetime. */
  kind: NodeDef['kind']
  /**
   * This node's path component: explicit `def.id` verbatim when present,
   * otherwise the slugified `value` (kinds without a display value use
   * their required `id`; id-less separators have an empty segment).
   */
  segment: string
  /**
   * Definition path: segments from the menu root to this node, including
   * its own segment, root-first. Only submenu, subpage, and tree-item
   * ancestors contribute segments (groups and radio-groups are
   * path-transparent). Empty segments are dropped.
   */
  defPath: string[]
  /** Row id: `def.id` verbatim when present, else `defPath.join('.')`. */
  id: string
  parent: PopupMenuNode | null
  children: PopupMenuNode[]
  /** Def-tree depth counting every node kind; roots are 0. */
  depth: number
  /** Sibling index in the def tree (position within `parent.children`). */
  index: number
}

/**
 * A menu node before its row id is assigned — the argument to `GetRowIdFn`.
 * Carries definitional facts only (`def`, `segment`, `defPath`, resolved
 * `parent`, `depth`, def-tree sibling `index`). Contextual facts (search
 * state, deep-search flags, display position) are deliberately absent:
 * a context-dependent row id is inexpressible by construction.
 */
export type UnidentifiedMenuNode = Omit<PopupMenuNode, 'id'>

/**
 * Computes a node's row id from definitional facts. The id must be unique
 * per menu root; it is the identity persistent state, registration, and
 * highlight key off.
 *
 * Contract: the id may read the node's own facts (including its own sibling
 * `index`) and may walk `parent` for lineage (as the default definition-path
 * rule does), but it must not depend on an *ancestor's* sibling `index` —
 * reconciliation invalidates ids by def identity and definition path, not by
 * ancestor reordering, so ancestor-index-dependent ids would go stale. The
 * seam must also not mutate its argument.
 */
export type GetRowIdFn = (node: UnidentifiedMenuNode) => string
