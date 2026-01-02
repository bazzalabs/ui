import type * as React from 'react'

/**
 * Direction of text/layout
 */
export type Direction = 'ltr' | 'rtl'

/**
 * Cause of an activation (highlight) change
 */
export type ActivationCause = 'pointer' | 'keyboard'

/**
 * Record for a registered row (item) in the menu
 */
export interface RowRecord {
  /** Unique identifier for this row */
  id: string
  /** Ref to the DOM element */
  ref: React.RefObject<HTMLElement | null>
  /** Whether the row is disabled */
  disabled: boolean
  /** The surface this row belongs to */
  surfaceId: string
}

/**
 * State for a single menu surface (root menu or submenu level)
 */
export interface SurfaceState {
  /** Unique identifier for this surface */
  id: string
  /** Parent surface ID (null for root) */
  parentId: string | null
  /** Whether this surface is open/visible */
  open: boolean
  /** Currently highlighted item ID */
  activeId: string | null
  /** Depth in the menu hierarchy (0 = root) */
  depth: number
}

/**
 * Core menu store state
 */
export interface MenuState {
  /** Whether the menu is open */
  open: boolean
  /** Whether the menu is disabled */
  disabled: boolean
  /** Current search/filter query */
  query: string
  /** Text direction */
  direction: Direction
  /** Whether vim-style keybindings are enabled */
  vimBindings: boolean
  /** Whether keyboard navigation should loop */
  loop: boolean
  /** Map of surface ID -> surface state */
  surfaces: Map<string, SurfaceState>
  /** Currently active surface ID */
  activeSurfaceId: string | null
  /** Map of row ID -> row record */
  rows: Map<string, RowRecord>
  /** Ordered array of row IDs for keyboard navigation */
  order: string[]
}

/**
 * Non-reactive context values (refs, callbacks)
 */
export interface MenuContext {
  /** Ref to the search input element */
  readonly inputRef: React.RefObject<HTMLInputElement | null>
  /** Ref to the list element */
  readonly listRef: React.RefObject<HTMLDivElement | null>
  /** Callback when open state changes (for controlled mode) */
  onOpenChange?: (open: boolean) => void
  /** Callback when query changes */
  onQueryChange?: (query: string) => void
}
