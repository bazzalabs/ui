// Display Nodes: the render-scoped wrappers the pipeline builds from Menu
// Nodes for one surface's current render. A framework supplies the Menu Node
// types they hold and the render contexts they carry (`T`).

/**
 * What a framework supplies to the Display Node shapes (`T`): the Menu Node
 * each kind holds, the render contexts, and its own row Display Node, which
 * group Display Nodes hold as items.
 */
export interface DisplayNodeTypes {
  /** A row's Menu Node (items, checkbox items, submenus, subpages, tree items). */
  rowNode: unknown
  /** A subpage's Menu Node. */
  subpageNode: unknown
  /** A group's Menu Node. */
  groupNode: unknown
  /** A radio group's Menu Node. */
  radioGroupNode: unknown
  /** A checkbox group's Menu Node. */
  checkboxGroupNode: unknown
  /** A separator's Menu Node. */
  separatorNode: unknown
  /** A checkbox group's def. */
  checkboxGroupDef: unknown
  /** The render context of a row or subpage. */
  rowContext: unknown
  /** The render context of a group, radio group, or checkbox group. */
  groupContext: unknown
  /** The framework's row Display Node. */
  rowDisplayNode: unknown
}

/**
 * A row node ready for display with its render context.
 * Used for items, radio items, checkbox items, and submenu triggers.
 */
export interface DisplayRowNode<T extends DisplayNodeTypes = DisplayNodeTypes> {
  kind: 'row'
  /** The resolved menu node; its authored definition is `node.def`. */
  node: T['rowNode']
  /** Pre-computed render context for this node */
  context: T['rowContext']
  /** Radio group this node belongs to, if rendering inside one */
  radioGroup?: { id: string; label?: string }
  /** Checkbox group this node belongs to, if rendering inside one. Carries the def so the row can be wrapped in the group's value provider. */
  checkboxGroup?: { id: string; label?: string; def: T['checkboxGroupDef'] }
}

/**
 * A subpage content node ready for display with its render context.
 * Used by DataSubpages to render subpage content alongside the root Surface.
 */
export interface DisplaySubpageNode<
  T extends DisplayNodeTypes = DisplayNodeTypes,
> {
  /** The resolved node for this subpage. The authored def is `node.def`. */
  node: T['subpageNode']
  /** Pre-computed render context for this subpage trigger/content */
  context: T['rowContext']
  /** Computed page ID for this subpage */
  pageId: string
}

/**
 * A group node ready for display with its render context.
 * Contains the group definition and its matching items.
 */
export interface DisplayGroupNode<
  T extends DisplayNodeTypes = DisplayNodeTypes,
> {
  kind: 'group'
  /** The resolved node; authored def at node.def. */
  node: T['groupNode']
  /** Pre-computed render context for this group */
  context: T['groupContext']
  /** Display nodes for items within this group */
  items: T['rowDisplayNode'][]
  /** Best match score among items in this group */
  bestScore: number
}

/**
 * A radio group node ready for display with its render context.
 * Contains the radio group definition and its items.
 */
export interface DisplayRadioGroupNode<
  T extends DisplayNodeTypes = DisplayNodeTypes,
> {
  kind: 'radio-group'
  /** The resolved node; authored def at node.def. */
  node: T['radioGroupNode']
  /** Pre-computed render context for this radio group */
  context: T['groupContext']
  /** Display nodes for items within this radio group */
  items: T['rowDisplayNode'][]
  /** Best match score among items in this radio group */
  bestScore: number
}

/**
 * A checkbox group node ready for display with its render context.
 * Contains the checkbox group definition and its items.
 */
export interface DisplayCheckboxGroupNode<
  T extends DisplayNodeTypes = DisplayNodeTypes,
> {
  kind: 'checkbox-group'
  node: T['checkboxGroupNode']
  context: T['groupContext']
  items: T['rowDisplayNode'][]
  bestScore: number
}

/**
 * A separator node ready for display.
 */
export interface DisplaySeparatorNode<
  T extends DisplayNodeTypes = DisplayNodeTypes,
> {
  kind: 'separator'
  /** The resolved node; authored def at node.def. */
  node: T['separatorNode']
}

/**
 * Union of all display node types.
 * Can be a row node (item/submenu/subpage), group node, radio group node, or separator.
 */
export type DisplayNode<T extends DisplayNodeTypes = DisplayNodeTypes> =
  | DisplayRowNode<T>
  | DisplayGroupNode<T>
  | DisplayRadioGroupNode<T>
  | DisplayCheckboxGroupNode<T>
  | DisplaySeparatorNode<T>

/**
 * Type guard for DisplayGroupNode.
 */
export function isDisplayGroupNode<T extends DisplayNodeTypes>(
  node: DisplayNode<T>,
): node is DisplayGroupNode<T> {
  return 'kind' in node && node.kind === 'group'
}

/**
 * Type guard for DisplayRadioGroupNode.
 */
export function isDisplayRadioGroupNode<T extends DisplayNodeTypes>(
  node: DisplayNode<T>,
): node is DisplayRadioGroupNode<T> {
  return 'kind' in node && node.kind === 'radio-group'
}

/**
 * Type guard for DisplayCheckboxGroupNode.
 */
export function isDisplayCheckboxGroupNode<T extends DisplayNodeTypes>(
  node: DisplayNode<T>,
): node is DisplayCheckboxGroupNode<T> {
  return 'kind' in node && node.kind === 'checkbox-group'
}

/**
 * Type guard for DisplaySeparatorNode.
 */
export function isDisplaySeparatorNode<T extends DisplayNodeTypes>(
  node: DisplayNode<T>,
): node is DisplaySeparatorNode<T> {
  return 'kind' in node && node.kind === 'separator'
}

/**
 * Type guard for DisplayRowNode (items, checkbox items, submenus, subpages).
 */
export function isDisplayRowNode<T extends DisplayNodeTypes>(
  node: DisplayNode<T>,
): node is DisplayRowNode<T> {
  return 'kind' in node && node.kind === 'row'
}
