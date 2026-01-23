import type * as React from 'react'
import type {
  CheckedChangeEventDetails,
  RadioValueChangeEventDetails,
} from '../events.js'

// ============================================================================
// getItemId - Unique ID Generation
// ============================================================================

/**
 * Context passed to the getItemId function.
 * Provides all information needed to generate a unique ID for an item.
 */
export interface GetItemIdContext {
  /** The node definition */
  node: ItemDef | CheckboxItemDef | SubmenuDef

  /** The node's value (node.value) - used as default identifier */
  value: string

  /** Position in the flattened display list (0-based) */
  index: number

  /**
   * Breadcrumb values from root to parent (e.g., ['Settings', 'Advanced']).
   * These are the `value` props of parent submenus.
   */
  breadcrumbs: string[]

  /** Search context, null if browsing */
  search: { query: string; score: number } | null

  /** Whether surfaced via deep search */
  isDeepSearchResult: boolean

  /** Group context, if any */
  group: { id: string; label?: string } | null

  /** Radio group context, if any */
  radioGroup: { id: string; label?: string } | null
}

/**
 * Function that generates a unique ID for an item.
 * Used for React keys, store registration, and DOM id attributes.
 */
export type GetItemIdFn = (context: GetItemIdContext) => string

// ============================================================================
// Render Context - passed to all render functions
// ============================================================================

/**
 * Context passed to item and submenu render functions.
 * Provides information about the current rendering context (search, breadcrumbs, state).
 */
export interface RowRenderContext {
  /**
   * Search context - the query in the menu where this row is being rendered.
   * `null` if no active search (browsing mode).
   */
  search: {
    /** Current search query */
    query: string
    /** Match score for this row (0-1, higher = better match) */
    score: number
  } | null

  /**
   * Full path of submenu values from root to this row's parent.
   * e.g., ['Settings', 'Advanced'] for an item inside the Advanced submenu.
   * Empty array [] for items directly in root menu.
   */
  breadcrumbs: string[]

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
}

// ============================================================================
// Item Render Params
// ============================================================================

/**
 * Props to spread onto the Item component.
 */
export interface ItemRenderProps {
  /** Unique ID for the item - must be passed to the rendered component for navigation to work */
  id: string
  /** Whether the item is disabled */
  disabled: boolean
  /** Whether clicking should close the menu */
  closeOnClick?: boolean
  /** Callback when the item is selected */
  onSelect?: () => void
  /** Keyboard shortcut for this item (e.g., "1", "2", etc.) */
  shortcut?: string
  /**
   * Value for this item when used inside a RadioGroup.
   * Defaults to the item's `id` if not specified.
   */
  value?: string
}

/**
 * Parameters passed to item render functions.
 */
export interface ItemRenderParams {
  /** Props to spread onto the Item component */
  props: ItemRenderProps
  /** Context for conditional rendering (includes props values for convenience) */
  context: RowRenderContext & {
    /** The node's value (ItemDef.value) */
    value: string
    disabled: boolean
  }
}

// ============================================================================
// Submenu Render Params
// ============================================================================

/**
 * Props to spread onto the SubmenuTrigger component.
 */
export interface SubmenuRenderProps {
  /** Unique ID for the submenu trigger - must be passed to the rendered component for navigation to work */
  id: string
  /** Whether the submenu trigger is disabled */
  disabled: boolean
}

/**
 * Parameters passed to submenu render functions.
 * Includes context plus the submenu's child nodes and render function.
 */
export interface SubmenuRenderParams {
  /** Props to spread onto the SubmenuTrigger */
  props: SubmenuRenderProps
  /** Context for conditional rendering (includes props values for convenience) */
  context: RowRenderContext & {
    /** The node's value (SubmenuDef.value) */
    value: string
    disabled: boolean
  }
  /** The submenu's child node definitions */
  nodes: NodeDef[]
  /**
   * Function to render a child node.
   * Call this for each node in the submenu's list.
   */
  renderNode: (node: NodeDef) => React.ReactNode
}

// ============================================================================
// Group Render Types
// ============================================================================

/**
 * Context passed to group render functions.
 * Contains information about the group's state during search.
 */
export interface GroupRenderContext {
  /**
   * Search context with the best match score among items in this group.
   * `null` if no active search (browsing mode).
   */
  search: {
    /** Current search query */
    query: string
    /** Best match score among items in this group (0-1) */
    bestScore: number
  } | null

  /** Number of matching items in this group */
  matchCount: number

  /**
   * Breadcrumbs if this group is from a surfaced submenu.
   * Empty array [] for groups in the root menu.
   */
  breadcrumbs: string[]

  /** Whether this group is from deep search (surfaced from a submenu) */
  isDeepSearchResult: boolean
}

/**
 * Parameters passed to group render functions.
 */
export interface GroupRenderParams {
  /** Props (empty for groups, but consistent structure) */
  props: Record<string, never>
  /** Context for conditional rendering (includes label for convenience) */
  context: GroupRenderContext & {
    /** The group's label */
    label?: string
  }
  /** Pre-rendered matching children */
  children: React.ReactNode
}

// ============================================================================
// Checkbox Item Types
// ============================================================================

/**
 * Props to spread onto the CheckboxItem component.
 */
export interface CheckboxItemRenderProps {
  /** Unique ID for the item - must be passed to the rendered component for navigation to work */
  id: string
  /** Whether the checkbox is checked */
  checked?: boolean
  /** Callback fired when checked state changes */
  onCheckedChange?: (
    checked: boolean,
    details: CheckedChangeEventDetails,
  ) => void
  /** Whether the item is disabled */
  disabled: boolean
  /** Whether clicking should close the menu */
  closeOnClick?: boolean
}

/**
 * Parameters passed to checkbox item render functions.
 */
export interface CheckboxItemRenderParams {
  /** Props to spread onto the CheckboxItem component */
  props: CheckboxItemRenderProps
  /** Context for conditional rendering (includes props values for convenience) */
  context: RowRenderContext & {
    /** The node's value (CheckboxItemDef.value) */
    value: string
    checked?: boolean
    disabled: boolean
  }
}

// ============================================================================
// Radio Group Types
// ============================================================================

/**
 * Props to spread onto the RadioGroup component.
 */
export interface RadioGroupRenderProps {
  /** Current selected value */
  value?: string
  /** Callback fired when value changes */
  onValueChange?: (value: string, details: RadioValueChangeEventDetails) => void
  /** Whether the radio group is disabled */
  disabled: boolean
}

/**
 * Parameters passed to radio group render functions.
 */
export interface RadioGroupRenderParams {
  /** Props to spread onto the RadioGroup component */
  props: RadioGroupRenderProps
  /** Context for conditional rendering */
  context: GroupRenderContext & {
    /** The radio group's label */
    label?: string
    /** Current selected value */
    value?: string
    /** Whether the radio group is disabled */
    disabled: boolean
  }
  /** Pre-rendered radio items */
  children: React.ReactNode
}

// ============================================================================
// Node Definitions
// ============================================================================

/**
 * Base properties shared by all node types.
 */
interface BaseNodeDef {
  /**
   * Unique identifier for this node.
   * If not provided, a composite ID is generated from the `value` and breadcrumbs
   * using the `getItemId` function.
   */
  id?: string
  /** Whether this node is hidden */
  hidden?: boolean
}

/**
 * Item node definition.
 * Represents a selectable menu item.
 */
export interface ItemDef extends BaseNodeDef {
  kind: 'item'
  /**
   * Primary identifier and search text for this item.
   * Used for search matching and as the default identifier.
   */
  value: string
  /** Additional keywords for search matching */
  keywords?: string[]
  /** Whether the item is disabled */
  disabled?: boolean
  /** Callback when the item is selected */
  onSelect?: () => void
  /** Whether to close the menu when this item is selected (default: true) */
  closeOnSelect?: boolean
  /** Keyboard shortcut for this item (e.g., "1", "2", etc.) */
  shortcut?: string

  /**
   * Render function for this item row.
   * Returns the JSX for the item.
   */
  render: (params: ItemRenderParams) => React.ReactNode
}

/**
 * Checkbox item node definition.
 * Represents a toggleable checkbox menu item.
 */
export interface CheckboxItemDef extends BaseNodeDef {
  kind: 'checkbox-item'
  /**
   * Primary identifier and search text for this checkbox item.
   * Used for search matching and as the default identifier.
   */
  value: string
  /** Additional keywords for search matching */
  keywords?: string[]
  /** Whether the item is disabled */
  disabled?: boolean
  /** Whether the checkbox is checked */
  checked?: boolean
  /** Callback when the checked state changes */
  onCheckedChange?: (
    checked: boolean,
    details: CheckedChangeEventDetails,
  ) => void
  /** Whether to close the menu when this item is selected (default: false for checkboxes) */
  closeOnSelect?: boolean

  /**
   * Render function for this checkbox item row.
   * Returns the JSX for the checkbox item.
   */
  render: (params: CheckboxItemRenderParams) => React.ReactNode
}

/**
 * Submenu node definition.
 * Represents a submenu trigger that opens a nested menu.
 */
export interface SubmenuDef extends BaseNodeDef {
  kind: 'submenu'
  /**
   * Primary identifier and search text for this submenu trigger.
   * Also used for breadcrumbs when deep search surfaces child items.
   */
  value: string
  /** Additional keywords for search matching */
  keywords?: string[]
  /** Whether the submenu trigger is disabled */
  disabled?: boolean

  /** Static child nodes */
  nodes?: NodeDef[]

  /**
   * Whether to include this submenu's children in deep search.
   * @default true
   */
  deepSearch?: boolean

  /**
   * Render function for the entire submenu structure.
   * Should return the complete submenu: trigger, portal, positioner, popup, surface, list.
   */
  render: (params: SubmenuRenderParams) => React.ReactNode
}

/**
 * Render params for separator nodes.
 */
export interface SeparatorRenderParams {
  /** Props to spread on the separator element */
  props: {
    /** Unique identifier */
    id?: string
  }
}

/**
 * Separator node definition.
 * Represents a visual separator between items.
 */
export interface SeparatorDef {
  kind: 'separator'
  /** Optional identifier */
  id?: string
  /** Optional render function for custom separator rendering */
  render?: (params: SeparatorRenderParams) => React.ReactNode
}

/**
 * Group node definition.
 * Represents a group of items with an optional label.
 */
export interface GroupDef {
  kind: 'group'
  /** Unique identifier for this group */
  id: string
  /** Optional group heading/label */
  label?: string
  /** Child nodes in this group */
  nodes: NodeDef[]
  /** Optional render function for the group container */
  render?: (params: GroupRenderParams) => React.ReactNode
}

/**
 * Radio group node definition.
 * Represents a group of radio items where only one can be selected.
 */
export interface RadioGroupDef {
  kind: 'radio-group'
  /** Unique identifier for this radio group */
  id: string
  /** Optional group heading/label */
  label?: string
  /** Current selected value */
  value?: string
  /** Callback when value changes */
  onValueChange?: (value: string, details: RadioValueChangeEventDetails) => void
  /** Whether the radio group is hidden */
  hidden?: boolean
  /** Whether the radio group is disabled */
  disabled?: boolean
  /** Child nodes in this radio group (typically ItemDef nodes that act as radio options) */
  nodes: (ItemDef | CheckboxItemDef | SubmenuDef)[]
  /** Optional render function for the radio group container */
  render?: (params: RadioGroupRenderParams) => React.ReactNode
}

/**
 * Helper function to create a radio group definition with proper typing.
 */
export function defineRadioGroup(def: RadioGroupDef): RadioGroupDef {
  return def
}

/**
 * Union of all node definition types.
 */
export type NodeDef =
  | ItemDef
  | CheckboxItemDef
  | SubmenuDef
  | SeparatorDef
  | GroupDef
  | RadioGroupDef

// ============================================================================
// Scored Node - internal type for search results
// ============================================================================

/**
 * A node with its search score and breadcrumb path.
 * Used internally during filtering and scoring.
 */
export interface ScoredNode {
  /** The original node definition */
  node: ItemDef | CheckboxItemDef | SubmenuDef
  /** Search match score (0-1) */
  score: number
  /**
   * Breadcrumb values leading to this node.
   * These are the `value` props of parent submenus.
   */
  breadcrumbs: string[]
  /** The group this node belongs to, if any */
  group: { id: string; label?: string; groupDef: GroupDef } | null
  /** The radio group this node belongs to, if any */
  radioGroup: {
    id: string
    label?: string
    radioGroupDef: RadioGroupDef
  } | null
}

// ============================================================================
// Display Node - node with render context attached
// ============================================================================

/**
 * A row node ready for display with its render context.
 * Used for items, checkbox items, and submenu triggers.
 */
export interface DisplayRowNode {
  /** The original node definition */
  node: ItemDef | CheckboxItemDef | SubmenuDef
  /** Pre-computed render context for this node */
  context: RowRenderContext
  /** Radio group this node belongs to, if rendering inside one */
  radioGroup?: { id: string; label?: string }
}

/**
 * A group node ready for display with its render context.
 * Contains the group definition and its matching items.
 */
export interface DisplayGroupNode {
  kind: 'group'
  /** The group definition */
  group: GroupDef
  /** Pre-computed render context for this group */
  context: GroupRenderContext
  /** Display nodes for items within this group */
  items: DisplayRowNode[]
  /** Best match score among items in this group */
  bestScore: number
}

/**
 * A radio group node ready for display with its render context.
 * Contains the radio group definition and its items.
 */
export interface DisplayRadioGroupNode {
  kind: 'radio-group'
  /** The radio group definition */
  radioGroup: RadioGroupDef
  /** Pre-computed render context for this radio group */
  context: GroupRenderContext
  /** Display nodes for items within this radio group */
  items: DisplayRowNode[]
  /** Best match score among items in this radio group */
  bestScore: number
}

/**
 * A separator node ready for display.
 */
export interface DisplaySeparatorNode {
  kind: 'separator'
  /** The separator definition */
  separator: SeparatorDef
}

/**
 * Union of all display node types.
 * Can be a row node (item/submenu), group node, radio group node, or separator.
 */
export type DisplayNode =
  | DisplayRowNode
  | DisplayGroupNode
  | DisplayRadioGroupNode
  | DisplaySeparatorNode

/**
 * Type guard for DisplayGroupNode.
 */
export function isDisplayGroupNode(
  node: DisplayNode,
): node is DisplayGroupNode {
  return 'kind' in node && node.kind === 'group'
}

/**
 * Type guard for DisplayRadioGroupNode.
 */
export function isDisplayRadioGroupNode(
  node: DisplayNode,
): node is DisplayRadioGroupNode {
  return 'kind' in node && node.kind === 'radio-group'
}

/**
 * Type guard for DisplaySeparatorNode.
 */
export function isDisplaySeparatorNode(
  node: DisplayNode,
): node is DisplaySeparatorNode {
  return 'kind' in node && node.kind === 'separator'
}

/**
 * Type guard for DisplayRowNode (items, checkbox items, submenus).
 */
export function isDisplayRowNode(node: DisplayNode): node is DisplayRowNode {
  return !('kind' in node)
}

// ============================================================================
// Deep Search Configuration
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
 * Configuration for deep search behavior.
 */
export interface DeepSearchConfig {
  /** Whether deep search is enabled */
  enabled?: boolean
  /** Minimum query length before deep search activates */
  minLength?: number
  /**
   * How groups behave during search results.
   * Only affects search mode - groups are always shown in browse mode.
   * Note: Radio groups have their own behavior controlled by radioGroupSearchBehavior.
   * @default 'preserve'
   */
  groupSearchBehavior?: GroupBehavior
  /**
   * How radio groups behave during search results.
   * - 'flatten': Radio items shown individually (not recommended).
   * - 'preserve': Only matching radio items are shown (default).
   * - 'preserve-show-all': All radio items are shown when any item matches.
   * @default 'preserve'
   */
  radioGroupSearchBehavior?: RadioGroupBehavior
  /**
   * Whether to sort groups by their best-matching item's score.
   * Only applies when groupSearchBehavior: 'preserve'.
   * @default true
   */
  sortGroups?: boolean
}

// ============================================================================
// Data Surface Props
// ============================================================================

/**
 * Props for the DataSurface component.
 */
export interface DataSurfaceProps {
  /** The menu content (node definitions with render functions) */
  content: NodeDef[]

  /** Deep search configuration */
  deepSearch?: DeepSearchConfig | boolean

  /** Filter function or false to disable filtering */
  filter?:
    | ((value: string, search: string, keywords?: string[]) => number)
    | false

  /** Controlled search value */
  search?: string

  /** Callback when search value changes */
  onSearchChange?: (search: string) => void

  /** Default search value for uncontrolled usage */
  defaultSearch?: string

  /** Whether navigation should loop */
  loop?: boolean

  /** Auto-highlight behavior when menu opens */
  autoHighlightFirst?: boolean | string

  /**
   * Whether to clear search on close.
   * - `true`: clear immediately when menu closes (default)
   * - `false`: preserve search when menu closes
   * - `'after-exit'`: clear after exit animation completes
   */
  clearSearchOnClose?: boolean | 'after-exit'

  /**
   * Function to generate unique IDs for items.
   * Called for each item when rendering to produce IDs for:
   * - React keys
   * - Store registration
   * - DOM id attributes
   *
   * @default Joins breadcrumbs with node.value using '.' separator
   */
  getItemId?: GetItemIdFn

  /** Children (Input, List, etc.) */
  children: React.ReactNode
}

// ============================================================================
// Data List Props
// ============================================================================

/**
 * State passed to the DataList render function.
 */
export interface DataListChildrenState {
  /** Current search query (empty string if browsing) */
  search: string

  /**
   * Display nodes (filtered and scored if searching).
   * Can include groups (DisplayGroupNode) or radio groups (DisplayRadioGroupNode)
   * when groupSearchBehavior: 'preserve'.
   */
  nodes: DisplayNode[]

  /**
   * Function to render a node.
   * Handles items, submenus, groups, and radio groups, calling their render functions with context.
   */
  renderNode: (displayNode: DisplayNode) => React.ReactNode

  /** Number of visible items (counting items inside groups) */
  count: number

  /** Whether deep search is active (query length >= minLength) */
  isDeepSearching: boolean
}

/**
 * Props for the DataList component.
 */
export interface DataListProps {
  /**
   * Render function for the list content.
   * Receives the current state and returns JSX.
   */
  children: (state: DataListChildrenState) => React.ReactNode

  /** Accessible label for the listbox */
  label?: string

  /** Additional class name */
  className?: string

  /** Additional styles */
  style?: React.CSSProperties

  /**
   * When true, measures row widths and applies `--row-width` CSS variable.
   * Keeps the list at the maximum width seen while scrolling.
   * Useful for virtualized lists where content width varies.
   * @default true
   */
  measureRowWidth?: boolean

  /**
   * Maximum width cap for row measurement (in pixels).
   * Only used when `measureRowWidth` is true.
   */
  maxRowWidth?: number
}
