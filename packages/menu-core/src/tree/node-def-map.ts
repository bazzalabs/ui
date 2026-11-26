import type {
  AsyncNodesConfigBase,
  IncludeInDeepSearch,
} from './branch-config.js'
import type {
  CheckboxGroupFields,
  CheckboxItemFields,
  ItemFields,
  LinkItemFields,
  RadioGroupFields,
  RadioItemFields,
  SubmenuTriggerFields,
  SubpageTriggerFields,
} from './part-fields.js'

// ============================================================================
// What a framework supplies
// ============================================================================

/**
 * The type of each render slot a node def has, by slot. A framework fills each
 * with its render callback: packages/react's take render params and return a
 * `ReactNode`.
 */
export interface NodeRenderSlots {
  /** `ItemNodeDef.render` */
  item: unknown
  /** `LinkItemNodeDef.render` */
  linkItem: unknown
  /** `TreeItemNodeDef.render` */
  treeItem: unknown
  /** `RadioItemNodeDef.render` */
  radioItem: unknown
  /** `CheckboxItemNodeDef.render` */
  checkboxItem: unknown
  /** `SubmenuNodeDef.render` */
  submenu: unknown
  /** `SubpageNodeDef.renderTrigger` */
  subpageTrigger: unknown
  /** `SubpageNodeDef.renderContent` */
  subpageContent: unknown
  /** `SeparatorNodeDef.render` */
  separator: unknown
  /** `GroupNodeDef.render` */
  group: unknown
  /** `GroupNodeDef.renderLabel` */
  groupLabel: unknown
  /** `RadioGroupNodeDef.render` */
  radioGroup: unknown
  /** `RadioGroupNodeDef.renderLabel` */
  radioGroupLabel: unknown
  /** `CheckboxGroupNodeDef.render` */
  checkboxGroup: unknown
  /** `CheckboxGroupNodeDef.renderLabel` */
  checkboxGroupLabel: unknown
}

/**
 * What a framework supplies to the node def schema (`R` in `NodeDefMap<R>`):
 * its render slot types, its loader configs, and its own def types, so the
 * children a def holds are typed as the framework's defs.
 */
export interface NodeDefTypes {
  /** Any node def: what a branch's, tree item's, or group's `nodes` hold. */
  nodeDef: { kind: string }
  /** The radio item def a radio group's `nodes` hold. */
  radioItemDef: { kind: 'radio-item' }
  /** The checkbox item def a checkbox group's `nodes` hold. */
  checkboxItemDef: { kind: 'checkbox-item' }
  /** A branch's `asyncNodes` config. */
  asyncNodes: AsyncNodesConfigBase
  /** The type of each render slot. */
  render: NodeRenderSlots
}

// ============================================================================
// Shared fields
// ============================================================================

/**
 * Base properties shared by all node types.
 */
export interface BaseNodeDef {
  /**
   * Unique identifier for this node.
   * If provided, it contributes the Definition Key and encoded surface path;
   * Resolved ID generation otherwise follows the root policy or its
   * `getResolvedId` seam.
   */
  id?: string
  /** Whether this node is hidden */
  hidden?: boolean
}

/**
 * Lets a node's `forceOrder` depend on how well it matches the search.
 */
export interface ForceOrderMinScoreDef {
  /**
   * The lowest search score at which `forceOrder` applies. A row that matches
   * with a lower score sorts by score, as if it had no `forceOrder`, and still
   * shows. `forceScore`, when set, is the score compared. `commandScore`
   * scores run from 0 to 1, so 0.5 keeps `forceOrder` for strong matches only.
   * @default undefined (`forceOrder` applies to every match)
   */
  forceOrderMinScore?: number
}

// ============================================================================
// Node defs, one per kind
// ============================================================================

/**
 * Item node definition.
 * Represents a selectable menu item.
 */
export interface ItemNodeDef<R extends NodeDefTypes = NodeDefTypes>
  extends BaseNodeDef,
    ForceOrderMinScoreDef,
    Required<Pick<ItemFields, 'value'>>,
    Pick<
      ItemFields,
      | 'keywords'
      | 'disabled'
      | 'onSelect'
      | 'closeOnClick'
      | 'shortcut'
      | 'forceOrder'
      | 'forceScore'
    > {
  kind: 'item'
  /**
   * Render function for this item row.
   * Returns the JSX for the item.
   */
  render: R['render']['item']
}

/**
 * Link item node definition. Represents a menu row that navigates to `href` when activated.
 */
export interface LinkItemNodeDef<R extends NodeDefTypes = NodeDefTypes>
  extends BaseNodeDef,
    ForceOrderMinScoreDef,
    Required<Pick<LinkItemFields, 'value'>>,
    Pick<
      LinkItemFields,
      | 'keywords'
      | 'disabled'
      | 'onSelect'
      | 'closeOnClick'
      | 'shortcut'
      | 'forceOrder'
      | 'forceScore'
    > {
  kind: 'link-item'
  /** The URL this item navigates to. */
  href: string
  render: R['render']['linkItem']
}

/** Tree item node definition. */
export interface TreeItemNodeDef<R extends NodeDefTypes = NodeDefTypes>
  extends BaseNodeDef,
    ForceOrderMinScoreDef,
    Required<Pick<ItemFields, 'value'>>,
    Pick<
      ItemFields,
      | 'keywords'
      | 'disabled'
      | 'onSelect'
      | 'closeOnClick'
      | 'forceOrder'
      | 'forceScore'
    > {
  kind: 'tree-item'
  /** Whether this row itself can be selected. */
  selectable?: boolean
  /** Inline children rendered in the same list. */
  nodes?: R['nodeDef'][]
  /** Whether descendants surface in deep search results. */
  deepSearch?: boolean
  /** Render function for this row. */
  render: R['render']['treeItem']
}

/**
 * Radio item node definition.
 * Represents a selectable radio menu item for use within a radio group def.
 */
export interface RadioItemNodeDef<R extends NodeDefTypes = NodeDefTypes>
  extends BaseNodeDef,
    ForceOrderMinScoreDef,
    Required<Pick<RadioItemFields, 'value'>>,
    Pick<
      RadioItemFields,
      | 'keywords'
      | 'disabled'
      | 'onSelect'
      | 'closeOnClick'
      | 'shortcut'
      | 'forceOrder'
      | 'forceScore'
    > {
  kind: 'radio-item'
  /**
   * Render function for this radio item row.
   * Returns the JSX for the radio item.
   */
  render: R['render']['radioItem']
}

/**
 * Checkbox item node definition.
 * Represents a toggleable checkbox menu item.
 */
export interface CheckboxItemNodeDef<R extends NodeDefTypes = NodeDefTypes>
  extends BaseNodeDef,
    ForceOrderMinScoreDef,
    Pick<
      CheckboxItemFields,
      | 'keywords'
      | 'disabled'
      | 'checked'
      | 'onCheckedChange'
      | 'closeOnClick'
      | 'forceOrder'
      | 'forceScore'
    > {
  kind: 'checkbox-item'
  /**
   * Primary identifier and search text for this checkbox item.
   * Used for search matching and as the default identifier.
   */
  value: string
  /**
   * Render function for this checkbox item row.
   * Returns the JSX for the checkbox item.
   */
  render: R['render']['checkboxItem']
}

/**
 * Submenu node definition.
 * Represents a submenu trigger that opens a nested menu.
 */
export interface SubmenuNodeDef<R extends NodeDefTypes = NodeDefTypes>
  extends BaseNodeDef,
    ForceOrderMinScoreDef,
    Required<Pick<SubmenuTriggerFields, 'value'>>,
    Pick<
      SubmenuTriggerFields,
      'keywords' | 'disabled' | 'forceOrder' | 'forceScore'
    > {
  kind: 'submenu'

  /** Static child nodes */
  nodes?: R['nodeDef'][]

  /**
   * Async child nodes configuration.
   * When provided, the Loader component will be rendered to fetch async data.
   * Async nodes are merged with static nodes.
   */
  asyncNodes?: R['asyncNodes']

  /**
   * Whether to include this submenu's descendants in deep search.
   * @default true
   */
  deepSearch?: boolean

  /**
   * Whether this submenu is included in ancestor deep search results.
   * - `true`: include submenu trigger and descendants
   * - `'trigger-only'`: include submenu trigger only
   * - `false`: exclude submenu trigger and descendants
   * @default true
   */
  includeInDeepSearch?: IncludeInDeepSearch

  /**
   * Render function for the entire submenu structure.
   * Should return the complete submenu: trigger, portal, positioner, popup, surface, list.
   */
  render: R['render']['submenu']
}

/**
 * Subpage node definition.
 * Represents a trigger row that opens a page in the same popup.
 */
export interface SubpageNodeDef<R extends NodeDefTypes = NodeDefTypes>
  extends BaseNodeDef,
    ForceOrderMinScoreDef,
    Required<Pick<SubpageTriggerFields, 'value'>>,
    Pick<
      SubpageTriggerFields,
      'keywords' | 'disabled' | 'forceOrder' | 'forceScore'
    > {
  kind: 'subpage'

  /** Static child nodes */
  nodes?: R['nodeDef'][]

  /**
   * Async child nodes configuration.
   * When provided, the Loader component will be rendered to fetch async data.
   * Async nodes are merged with static nodes.
   */
  asyncNodes?: R['asyncNodes']

  /**
   * Whether to include this subpage's descendants in deep search.
   * @default true
   */
  deepSearch?: boolean

  /**
   * Whether this subpage is included in ancestor deep search results.
   * - `true`: include subpage trigger and descendants
   * - `'trigger-only'`: include subpage trigger only
   * - `false`: exclude subpage trigger and descendants
   * @default true
   */
  includeInDeepSearch?: IncludeInDeepSearch

  /**
   * Render function for the trigger row.
   * Should return a `SubpageTrigger`.
   */
  renderTrigger: R['render']['subpageTrigger']

  /**
   * Render function for the subpage content.
   * Should return a `Subpage` rendered alongside the root Surface in Popup.
   */
  renderContent: R['render']['subpageContent']
}

/**
 * Separator node definition.
 * Represents a visual separator between items.
 */
export interface SeparatorNodeDef<R extends NodeDefTypes = NodeDefTypes> {
  kind: 'separator'
  /** Unique identifier */
  id: string
  /** Optional render function for custom separator rendering */
  render?: R['render']['separator']
}

/**
 * Group node definition.
 * Represents a group of items with an optional label.
 */
export interface GroupNodeDef<R extends NodeDefTypes = NodeDefTypes> {
  kind: 'group'
  /** Unique identifier for this group */
  id: string
  /** Optional group heading/label */
  label?: string
  /** Child nodes in this group */
  nodes: R['nodeDef'][]
  /** Optional render function for the group container */
  render?: R['render']['group']
  /**
   * Optional render function for the group's label row.
   * Used by the default group container when no `render` is provided, and by
   * virtualized lists (which ignore `render` and use only the label row).
   * Precedence: `render` > `renderLabel` > `label`.
   */
  renderLabel?: R['render']['groupLabel']
}

/**
 * Radio group node definition.
 * Represents a group of radio items where only one can be selected.
 */
export interface RadioGroupNodeDef<R extends NodeDefTypes = NodeDefTypes>
  extends Pick<RadioGroupFields, 'value' | 'onValueChange' | 'disabled'> {
  kind: 'radio-group'
  /** Unique identifier for this radio group */
  id: string
  /** Optional group heading/label */
  label?: string
  /** Whether the radio group is hidden */
  hidden?: boolean
  /** Child nodes in this radio group - must be RadioItemDef nodes */
  nodes: R['radioItemDef'][]
  /** Optional render function for the radio group container */
  render?: R['render']['radioGroup']
  /**
   * Optional render function for the radio group's label row.
   * Used by the default radio group container when no `render` is provided, and by
   * virtualized lists (which ignore `render` and use only the label row).
   * Precedence: `render` > `renderLabel` > `label`.
   */
  renderLabel?: R['render']['radioGroupLabel']
}

/**
 * Checkbox group node definition.
 * Represents a group of checkbox items whose checked state the group owns as one array of values.
 */
export interface CheckboxGroupNodeDef<R extends NodeDefTypes = NodeDefTypes>
  extends Pick<CheckboxGroupFields, 'onValueChange' | 'disabled'> {
  kind: 'checkbox-group'
  /** Unique identifier for this checkbox group */
  id: string
  /** Optional group heading/label */
  label?: string
  /** Whether the checkbox group is hidden */
  hidden?: boolean
  /** Values of the currently checked items (controlled). */
  value: string[]
  /** Child nodes in this checkbox group - must be CheckboxItemDef nodes */
  nodes: R['checkboxItemDef'][]
  /** Optional render function for the checkbox group container */
  render?: R['render']['checkboxGroup']
  /**
   * Optional render function for the checkbox group's label row.
   * Used by the default checkbox group container when no `render` is provided, and by
   * virtualized lists (which ignore `render` and use only the label row).
   * Precedence: `render` > `renderLabel` > `label`.
   */
  renderLabel?: R['render']['checkboxGroupLabel']
}

// ============================================================================
// The map
// ============================================================================

/**
 * Every node def kind and its def, with render slots and child defs typed by
 * what the framework supplies in `R`.
 */
export interface NodeDefMap<R extends NodeDefTypes = NodeDefTypes> {
  item: ItemNodeDef<R>
  'link-item': LinkItemNodeDef<R>
  'tree-item': TreeItemNodeDef<R>
  'radio-item': RadioItemNodeDef<R>
  'checkbox-item': CheckboxItemNodeDef<R>
  submenu: SubmenuNodeDef<R>
  subpage: SubpageNodeDef<R>
  separator: SeparatorNodeDef<R>
  group: GroupNodeDef<R>
  'radio-group': RadioGroupNodeDef<R>
  'checkbox-group': CheckboxGroupNodeDef<R>
}

/** Any node def: the union of every kind's def. */
export type NodeDef<R extends NodeDefTypes = NodeDefTypes> =
  NodeDefMap<R>[keyof NodeDefMap<R>]

/** A def that renders as one row. */
export type RowNodeDef<R extends NodeDefTypes = NodeDefTypes> = NodeDefMap<R>[
  | 'item'
  | 'link-item'
  | 'radio-item'
  | 'checkbox-item'
  | 'submenu'
  | 'subpage'
  | 'tree-item']
