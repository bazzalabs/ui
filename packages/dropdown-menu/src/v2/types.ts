import type * as React from 'react'

// ============================================================================
// Shared Types
// ============================================================================

/**
 * Activation cause for focus changes.
 */
export type ActivationCause = 'pointer' | 'keyboard' | 'focus'

/**
 * Direction for RTL/LTR support.
 */
export type Direction = 'ltr' | 'rtl'

/**
 * Positioning side for content/subcontent.
 */
export type Side = 'top' | 'right' | 'bottom' | 'left'

/**
 * Positioning alignment for content/subcontent.
 */
export type Align = 'start' | 'center' | 'end'

/**
 * Opening modality for submenus.
 */
export type OpenModality = 'pointer' | 'keyboard'

// ============================================================================
// Node Registration (Collection System)
// ============================================================================

/**
 * Type of node in the collection.
 */
export type NodeKind =
  | 'item'
  | 'checkbox-item'
  | 'radio-item'
  | 'submenu-trigger'
  | 'group'
  | 'separator'
  | 'label'

/**
 * Data stored for each registered node in the collection.
 * Used for keyboard navigation, deep search, and rendering.
 */
export interface NodeRegistration<TData = unknown> {
  /** Unique identifier for the node */
  id: string
  /** Type of node */
  kind: NodeKind
  /** Text content for searching and typeahead */
  textValue: string
  /** Additional search keywords */
  keywords?: string[]
  /** Whether the node is disabled */
  disabled?: boolean
  /** Path of parent submenu IDs from root */
  parentPath: string[]
  /** ID of the containing group, if any */
  groupId?: string | null
  /** Custom data associated with this node */
  data?: TData
  /** Function to render this node (for deep search results) */
  render: () => React.ReactNode
  /** Reference to the DOM element */
  ref?: React.RefObject<HTMLElement | null>
}

/**
 * A search result with scoring and breadcrumb information.
 */
export interface SearchResult<TData = unknown> {
  /** The matched node registration */
  node: NodeRegistration<TData>
  /** Search score (higher = better match) */
  score: number
  /** Human-readable breadcrumb path (e.g., ["Share", "Social"]) */
  breadcrumbs: string[]
  /** ID path (e.g., ["share", "social"]) */
  breadcrumbIds: string[]
}

// ============================================================================
// Collection
// ============================================================================

/**
 * Collection of registered nodes for a menu surface.
 */
export interface Collection<TData = unknown> {
  /** Map of node ID to registration */
  nodes: Map<string, NodeRegistration<TData>>
  /** Ordered list of node IDs (insertion order) */
  order: string[]
  /** Map of submenu ID to its label (for breadcrumbs) */
  submenuLabels: Map<string, string>
}

/**
 * Actions to manipulate the collection.
 */
export interface CollectionActions<TData = unknown> {
  /** Register a node and return unregister function */
  register: (node: NodeRegistration<TData>) => () => void
  /** Unregister a node by ID */
  unregister: (id: string) => void
  /** Register a submenu label for breadcrumbs */
  registerSubmenuLabel: (id: string, label: string) => void
  /** Get a node by ID */
  getNode: (id: string) => NodeRegistration<TData> | undefined
  /** Get all registered nodes */
  getAllNodes: () => NodeRegistration<TData>[]
  /** Get only searchable nodes (items, checkbox, radio - not groups/separators) */
  getSearchableNodes: () => NodeRegistration<TData>[]
  /** Get navigable node IDs in order (excludes disabled, separators, labels) */
  getNavigableIds: () => string[]
  /** Get submenu label by ID */
  getSubmenuLabel: (id: string) => string | undefined
}

// ============================================================================
// Aim Guard (Safe Polygon)
// ============================================================================

/**
 * Point in 2D space.
 */
export interface Point {
  x: number
  y: number
}

/**
 * Which side of the content the trigger is anchored to.
 */
export type AnchorSide = 'left' | 'right' | 'top' | 'bottom'

/**
 * Aim guard state for preventing accidental submenu closure.
 */
export interface AimGuardState {
  /** Whether aim guard is currently active */
  active: boolean
  /** ID of the trigger being guarded */
  guardedTriggerId: string | null
  /** Surface ID containing the guarded trigger */
  guardedSurfaceId: string | null
  /** Timeout ID for auto-clear */
  timeoutId: ReturnType<typeof setTimeout> | null
}

// ============================================================================
// Custom Events
// ============================================================================

/**
 * Custom event for item selection.
 */
export const SELECT_ITEM_EVENT = 'dropdownmenu.selectItem' as const

/**
 * Custom event for opening submenu.
 */
export const OPEN_SUBMENU_EVENT = 'dropdownmenu.openSubmenu' as const

// ============================================================================
// Focus Owner
// ============================================================================

/**
 * Focus owner context value.
 * Tracks which surface currently owns DOM focus across the menu tree.
 */
export interface FocusOwnerContextValue {
  /** ID of the surface that currently owns DOM focus, or null if none */
  ownerId: string | null
  /** Set the focus owner by surface ID */
  setOwnerId: (id: string | null) => void
}
