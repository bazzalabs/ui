import type * as React from 'react'

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
   * Full path of submenu titles from root to this row's parent.
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
}

// ============================================================================
// Submenu Render Params - additional context for submenu render functions
// ============================================================================

/**
 * Parameters passed to submenu render functions.
 * Includes context plus the submenu's child nodes and render function.
 */
export interface SubmenuRenderParams {
  /** Row render context (search, breadcrumbs, state) */
  context: RowRenderContext

  /** The submenu's child node definitions */
  nodes: NodeDef[]

  /**
   * Function to render a child node.
   * Call this for each node in the submenu's list.
   */
  renderNode: (node: NodeDef) => React.ReactNode
}

// ============================================================================
// Item Render Params
// ============================================================================

/**
 * Parameters passed to item render functions.
 */
export interface ItemRenderParams {
  /** Row render context (search, breadcrumbs, state) */
  context: RowRenderContext
}

// ============================================================================
// Node Definitions
// ============================================================================

/**
 * Base properties shared by all node types.
 */
interface BaseNodeDef {
  /** Unique identifier for this node */
  id: string
  /** Whether this node is hidden */
  hidden?: boolean
}

/**
 * Item node definition.
 * Represents a selectable menu item.
 */
export interface ItemDef extends BaseNodeDef {
  kind: 'item'
  /** Label used for search matching */
  label: string
  /** Additional keywords for search matching */
  keywords?: string[]
  /** Whether the item is disabled */
  disabled?: boolean
  /** Callback when the item is selected */
  onSelect?: () => void
  /** Whether to close the menu when this item is selected (default: true) */
  closeOnSelect?: boolean

  /**
   * Render function for this item row.
   * Returns the JSX for the item.
   */
  render: (params: ItemRenderParams) => React.ReactNode
}

/**
 * Submenu node definition.
 * Represents a submenu trigger that opens a nested menu.
 */
export interface SubmenuDef extends BaseNodeDef {
  kind: 'submenu'
  /**
   * Title used for breadcrumbs (required).
   * This is different from the trigger's display label.
   */
  title: string
  /** Label used for search matching (defaults to title) */
  label?: string
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
 * Separator node definition.
 * Represents a visual separator between items.
 */
export interface SeparatorDef {
  kind: 'separator'
  /** Optional identifier */
  id?: string
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
}

/**
 * Union of all node definition types.
 */
export type NodeDef = ItemDef | SubmenuDef | SeparatorDef | GroupDef

// ============================================================================
// Scored Node - internal type for search results
// ============================================================================

/**
 * A node with its search score and breadcrumb path.
 * Used internally during filtering and scoring.
 */
export interface ScoredNode {
  /** The original node definition */
  node: ItemDef | SubmenuDef
  /** Search match score (0-1) */
  score: number
  /** Breadcrumb titles leading to this node */
  breadcrumbs: string[]
  /** Breadcrumb IDs leading to this node */
  breadcrumbIds: string[]
}

// ============================================================================
// Display Node - node with render context attached
// ============================================================================

/**
 * A node ready for display with its render context.
 */
export interface DisplayNode {
  /** The original node definition */
  node: ItemDef | SubmenuDef
  /** Pre-computed render context for this node */
  context: RowRenderContext
}

// ============================================================================
// Deep Search Configuration
// ============================================================================

/**
 * Configuration for deep search behavior.
 */
export interface DeepSearchConfig {
  /** Whether deep search is enabled */
  enabled?: boolean
  /** Minimum query length before deep search activates */
  minLength?: number
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

  /** Whether to clear search on close */
  clearSearchOnClose?: boolean

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

  /** Display nodes (filtered and scored if searching) */
  nodes: DisplayNode[]

  /**
   * Function to render a node.
   * Handles both items and submenus, calling their render functions with context.
   */
  renderNode: (displayNode: DisplayNode) => React.ReactNode

  /** Number of visible nodes */
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
}
