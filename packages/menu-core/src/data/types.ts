import type {
  DisplayCheckboxGroupNode,
  DisplayGroupNode,
  DisplayNode,
  DisplayNodeTypes,
  DisplayRadioGroupNode,
  DisplayRowNode,
} from '../tree/display-node.js'
import type {
  AnyMenuNode,
  MenuNode,
  MenuNodeOfKind,
} from '../tree/menu-node.js'
import type { AnyNodeDef, RowNodeDef } from '../tree/node-def-map.js'

// The data pipeline's shapes: the Breadcrumbs, render contexts, scored rows,
// and Display Nodes it builds from a surface's Menu Nodes. The shapes take the
// types they hold from a `PipelineTypes` bundle; the pipeline's functions,
// generic over the framework's Menu Node `N`, build them for
// `PipelineDisplayTypes<N>`.

/** A Menu Node constraint: a framework's Menu Node whose links are its own type. */
export type PipelineMenuNode<N> = MenuNode<AnyNodeDef, N>

/** A row's Menu Node: an item, link item, radio item, checkbox item, submenu, subpage, or tree item. */
export type RowMenuNode<N extends { def: AnyNodeDef } = AnyMenuNode> =
  MenuNodeOfKind<N, RowNodeDef['kind']>

/** A Branch's Menu Node: a submenu or subpage. */
export type BranchMenuNode<N extends { def: AnyNodeDef } = AnyMenuNode> =
  MenuNodeOfKind<N, 'submenu' | 'subpage'>

/** A Menu Node a Breadcrumb can hold: a Branch or a tree item. */
export type BreadcrumbMenuNode<N extends { def: AnyNodeDef } = AnyMenuNode> =
  MenuNodeOfKind<N, 'submenu' | 'subpage' | 'tree-item'>

// ============================================================================
// Deep Search behaviours
// ============================================================================

/**
 * Defines how groups behave during deep search.
 * - 'flatten': Groups become invisible, items shown in flat list by score.
 * - 'preserve': Groups are shown as containers with their matching items.
 * Note: Radio groups are ALWAYS preserved regardless of this setting.
 */
export type GroupBehavior = 'flatten' | 'preserve'

/**
 * Defines how radio groups behave during deep search.
 * - 'flatten': Radio group items are shown individually in the flat list (not recommended).
 * - 'preserve': Radio group is shown with only matching items visible.
 * - 'preserve-show-all': Radio group is shown with ALL items visible when any item matches.
 *   This is useful when you want users to see all options in a radio group.
 */
export type RadioGroupBehavior = 'flatten' | 'preserve' | 'preserve-show-all'
/**
 * Defines how checkbox groups behave during deep search.
 * - 'flatten': Checkbox group items are shown individually in the flat list (not recommended).
 * - 'preserve': Checkbox group is shown with only matching items visible.
 * - 'preserve-show-all': Checkbox group is shown with ALL items visible when any item matches.
 *   This is useful when you want users to see all options in a checkbox group.
 */
export type CheckboxGroupBehavior = 'flatten' | 'preserve' | 'preserve-show-all'

/**
 * How the descendants of a disabled branch (a submenu or subpage with
 * `disabled: true`) participate in deep search.
 * - 'exclude': descendants are not deep results; the disabled trigger still is.
 *   Equivalent to the branch's `includeInDeepSearch` defaulting to `'trigger-only'`.
 * - 'inherit': descendants are deep results that inherit `disabled` — shown, not selectable.
 */
export type DisabledBranchBehavior = 'exclude' | 'inherit'

// ============================================================================
// What the shapes hold
// ============================================================================

/**
 * The types the pipeline's shapes hold: the Display Node types, plus the Menu
 * Node a Breadcrumb points at and the Breadcrumb type itself. A framework can
 * supply its own named types here, as long as they have these shapes.
 */
export interface PipelineTypes extends DisplayNodeTypes {
  /** A row's Menu Node. */
  rowNode: { def: unknown }
  /** A group's Menu Node. */
  groupNode: { def: unknown }
  /** A radio group's Menu Node. */
  radioGroupNode: { def: unknown }
  /** A checkbox group's Menu Node. */
  checkboxGroupNode: { def: unknown }
  /** The Menu Node a Breadcrumb points at: a submenu, subpage, or tree item. */
  breadcrumbNode: { def: unknown }
  /** A Breadcrumb. */
  breadcrumb: unknown
}

/**
 * The pipeline's types for a framework's Menu Node `N`: its Menu Nodes
 * narrowed by kind, and the pipeline's own Breadcrumbs and render contexts.
 */
export interface PipelineDisplayTypes<
  N extends PipelineMenuNode<N> = AnyMenuNode,
> extends PipelineTypes {
  rowNode: RowMenuNode<N>
  subpageNode: MenuNodeOfKind<N, 'subpage'>
  groupNode: MenuNodeOfKind<N, 'group'>
  radioGroupNode: MenuNodeOfKind<N, 'radio-group'>
  checkboxGroupNode: MenuNodeOfKind<N, 'checkbox-group'>
  separatorNode: MenuNodeOfKind<N, 'separator'>
  checkboxGroupDef: MenuNodeOfKind<N, 'checkbox-group'>['def']
  breadcrumbNode: BreadcrumbMenuNode<N>
  breadcrumb: BreadcrumbNode<PipelineDisplayTypes<N>>
  rowContext: RowRenderContext<PipelineDisplayTypes<N>>
  groupContext: GroupRenderContext<PipelineDisplayTypes<N>>
  rowDisplayNode: DisplayRowNode<PipelineDisplayTypes<N>>
}

// ============================================================================
// Breadcrumbs and render contexts
// ============================================================================

/**
 * Branch node info passed in breadcrumbs context.
 * Contains the full submenu/subpage definition for maximum flexibility.
 */
export interface BreadcrumbNode<
  T extends PipelineTypes = PipelineDisplayTypes,
> {
  /** The branch node definition */
  node: T['breadcrumbNode']['def']
  /** The branch Menu Node. `node`, `value`, and `id` mirror its def for compatibility. */
  menuNode: T['breadcrumbNode']
  /** The branch node's value */
  value: string
  /** The branch node's explicit id (if provided) */
  id?: string
}

/**
 * Context passed to item, submenu, and subpage render functions.
 * Provides information about the current rendering context (search, breadcrumbs, state).
 */
export interface RowRenderContext<
  T extends PipelineTypes = PipelineDisplayTypes,
> {
  /**
   * Search context - the query in the menu where this row is being rendered.
   * `null` if no active search (browsing mode).
   */
  search: {
    /** Current search query */
    query: string
    /** Match score for this row (higher = better match). */
    score: number
  } | null

  /**
   * Full path of branch nodes from root to this row's parent.
   * Contains the full submenu/subpage node definitions for maximum flexibility.
   * Empty array [] for items directly in root menu.
   */
  breadcrumbs: T['breadcrumb'][]

  /**
   * True if this row is being rendered outside its "home" menu
   * (surfaced via deep search from an ancestor menu).
   */
  isDeepSearchResult: boolean

  /** Whether this row is currently highlighted/focused */
  highlighted: boolean

  /** Whether this row is disabled */
  disabled: boolean

  /**
   * The group this item belongs to, if any.
   * `null` if the item is not inside a group.
   */
  group: { id: string; label?: string } | null

  /** Tree rendering context, or null for non-tree and search rows. */
  tree: {
    depth: number
    hasChildren: boolean
    isLastChild: boolean
    ancestorsLast: boolean[]
    header: boolean
  } | null
}

/**
 * Context passed to group render functions.
 * Contains information about the group's state during search.
 */
export interface GroupRenderContext<
  T extends PipelineTypes = PipelineDisplayTypes,
> {
  /**
   * Search context with the best match score among items in this group.
   * `null` if no active search (browsing mode).
   */
  search: {
    /** Current search query */
    query: string
    /** Best match score among items in this group (higher = better match). */
    bestScore: number
  } | null

  /** Number of matching items in this group */
  matchCount: number

  /**
   * Breadcrumb nodes if this group is from a surfaced submenu.
   * Empty array [] for groups in the root menu.
   */
  breadcrumbs: T['breadcrumb'][]

  /** Whether this group is from deep search (surfaced from a submenu) */
  isDeepSearchResult: boolean
}

// ============================================================================
// Flattened and scored rows
// ============================================================================

/**
 * A node with its search score and breadcrumb path.
 * Used internally during filtering and scoring.
 */
export interface ScoredNode<T extends PipelineTypes = PipelineDisplayTypes> {
  /** The row's Menu Node; its authored definition is `node.def`. */
  node: T['rowNode']
  /** Search match score (higher = better match). */
  score: number
  /**
   * Breadcrumb nodes leading to this node.
   * Contains the full submenu definitions for maximum flexibility.
   */
  breadcrumbs: T['breadcrumb'][]
  /** The group this node belongs to, if any */
  group: {
    id: string
    label?: string
    groupDef: T['groupNode']['def']
    menuNode: T['groupNode']
  } | null
  /** The radio group this node belongs to, if any */
  radioGroup: {
    id: string
    label?: string
    radioGroupDef: T['radioGroupNode']['def']
    menuNode: T['radioGroupNode']
  } | null
  /** The checkbox group this node belongs to, if any */
  checkboxGroup: {
    id: string
    label?: string
    checkboxGroupDef: T['checkboxGroupNode']['def']
    menuNode: T['checkboxGroupNode']
  } | null
}

/** A row surfaced by `flattenNodes`, with the containers it was found under. */
export interface FlattenedNode<T extends PipelineTypes = PipelineDisplayTypes> {
  /** The row's Menu Node; its authored definition is `node.def`. */
  node: T['rowNode']
  /** Breadcrumb nodes (branch nodes from root to parent) */
  breadcrumbs: T['breadcrumb'][]
  /** The group this node belongs to, if any */
  group: ScoredNode<T>['group']
  /** The radio group this node belongs to, if any */
  radioGroup: ScoredNode<T>['radioGroup']
  /** The checkbox group this node belongs to, if any */
  checkboxGroup: ScoredNode<T>['checkboxGroup']
  /** Keywords inherited from tree ancestors. */
  inheritedKeywords: string[]
}

// ============================================================================
// Display Nodes
// ============================================================================

/** A Display Node the pipeline builds for Menu Node `N`. */
export type PipelineDisplayNode<N extends PipelineMenuNode<N> = AnyMenuNode> =
  DisplayNode<PipelineDisplayTypes<N>>

/** A row Display Node the pipeline builds for Menu Node `N`. */
export type PipelineDisplayRowNode<
  N extends PipelineMenuNode<N> = AnyMenuNode,
> = DisplayRowNode<PipelineDisplayTypes<N>>

/** A group Display Node the pipeline builds for Menu Node `N`. */
export type PipelineDisplayGroupNode<
  N extends PipelineMenuNode<N> = AnyMenuNode,
> = DisplayGroupNode<PipelineDisplayTypes<N>>

/** A radio group Display Node the pipeline builds for Menu Node `N`. */
export type PipelineDisplayRadioGroupNode<
  N extends PipelineMenuNode<N> = AnyMenuNode,
> = DisplayRadioGroupNode<PipelineDisplayTypes<N>>

/** A checkbox group Display Node the pipeline builds for Menu Node `N`. */
export type PipelineDisplayCheckboxGroupNode<
  N extends PipelineMenuNode<N> = AnyMenuNode,
> = DisplayCheckboxGroupNode<PipelineDisplayTypes<N>>
