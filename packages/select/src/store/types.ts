import type { LoaderProgress, LoadMode } from '@bazza-ui/menu'
import type { SelectMenu, SelectMenuDef, SelectNode } from '../types.js'

/* ================================================================================================
 * Select Surface State
 * ============================================================================================== */

/**
 * Surface state for select menus.
 * Includes hover state (inherited from popup pattern) but no submenus.
 */
export type SelectSurfaceSlice<TData = unknown> = {
  /** Unique surface identifier */
  id: string
  /** Depth in menu tree (always 0 for select - no submenus) */
  depth: number
  /** Parent surface ID (always null for select) */
  parentId: string | null
  /** Whether surface is open/visible */
  open: boolean
  /** Current search query */
  query: string
  /** Currently active/focused item ID */
  activeId: string | null
  /** Whether search input is focused */
  inputActive: boolean

  // ─────────────────────────────────────────────────────────────────
  // Node State
  // ─────────────────────────────────────────────────────────────────

  /** Original menu definition */
  menuDef: SelectMenuDef<TData> | undefined
  /** Instantiated menu with runtime nodes */
  menu: SelectMenu<TData> | null
  /** Nodes after search/filter */
  filteredNodes: SelectNode<TData>[]
  /** Nodes after middleware (render-ready) */
  displayNodes: SelectNode<TData>[]

  // ─────────────────────────────────────────────────────────────────
  // Loading State
  // ─────────────────────────────────────────────────────────────────

  /** Whether async loader is fetching */
  isLoading: boolean
  /** Loader error if any */
  error: Error | null
  /** Loading progress for streaming mode */
  loadingProgress: {
    mode: LoadMode
    completedPaths: string[]
    inProgressPaths: string[]
    progress: LoaderProgress[]
  } | null

  // ─────────────────────────────────────────────────────────────────
  // Hover State (inherited from popup pattern)
  // ─────────────────────────────────────────────────────────────────

  hover: {
    /** Whether hover-open is suppressed (e.g., keyboard navigation mode) */
    suppressHoverOpen: boolean
    /** Currently hovered item ID */
    hoveredId: string | null
    /** Timestamp of last hover */
    hoverTimestamp: number
  }
}

/* ================================================================================================
 * Selection State
 * ============================================================================================== */

/**
 * Selection state for single select.
 */
export type SingleSelectionState = {
  mode: 'single'
  /** Currently selected value */
  value: string | undefined
}

/**
 * Selection state for multi-select.
 */
export type MultiSelectionState = {
  mode: 'multi'
  /** Currently selected values */
  values: string[]
  /** Maximum number of selections allowed */
  max: number | undefined
  /** Minimum number of selections required */
  min: number | undefined
}

/**
 * Union of selection states.
 */
export type SelectionState = SingleSelectionState | MultiSelectionState

/* ================================================================================================
 * Aim Guard State (inherited from popup pattern)
 * ============================================================================================== */

/**
 * Aim guard state - not really used in select (no submenus) but kept for compatibility.
 */
export type AimGuardState = {
  /** Whether aim guard is currently active */
  active: boolean
  /** ID of the trigger being guarded */
  guardedTriggerId: string | null
  /** Surface ID that owns the guarded trigger */
  guardedSurfaceId: string | null
  /** Timeout ID for auto-clearing the guard */
  timeoutId: number | null
}

/* ================================================================================================
 * Select Menu Store State
 * ============================================================================================== */

/**
 * Complete store state for select menus.
 */
export type SelectMenuStoreState<TData = unknown> = {
  /** Root-level state */
  root: {
    scopeId: string
    open: boolean
    disabled: boolean
  }
  /** Surface registry (single surface for select) */
  surfaces: Map<string, SelectSurfaceSlice<TData>>
  /** Focus ownership */
  focus: {
    ownerId: string | null
  }
  /** Keyboard configuration */
  keyboard: {
    dir: 'ltr' | 'rtl'
    vimBindings: boolean
  }
  /** Aim guard state (inherited from popup) */
  aimGuard: AimGuardState
  /** Selection state */
  selection: SelectionState
}

/* ================================================================================================
 * Select Menu Store Actions
 * ============================================================================================== */

/**
 * Complete store actions for select menus.
 */
export type SelectMenuStoreActions<TData = unknown> = {
  // ═══════════════════════════════════════════════════════════════════════
  // Root Actions
  // ═══════════════════════════════════════════════════════════════════════

  setOpen: (open: boolean) => void
  setDisabled: (disabled: boolean) => void
  setKeyboard: (
    opts: Partial<{ dir: 'ltr' | 'rtl'; vimBindings: boolean }>,
  ) => void

  // ═══════════════════════════════════════════════════════════════════════
  // Surface Lifecycle
  // ═══════════════════════════════════════════════════════════════════════

  registerSurface: (
    id: string,
    opts: {
      depth: number
      parentId?: string
      menuDef?: SelectMenuDef<TData>
    },
  ) => void
  unregisterSurface: (id: string) => void

  // ═══════════════════════════════════════════════════════════════════════
  // Surface State Updates
  // ═══════════════════════════════════════════════════════════════════════

  setSurfaceOpen: (surfaceId: string, open: boolean) => void
  setSurfaceQuery: (surfaceId: string, query: string) => void
  setSurfaceActiveId: (surfaceId: string, id: string | null) => void
  setSurfaceInputActive: (surfaceId: string, active: boolean) => void

  // ═══════════════════════════════════════════════════════════════════════
  // Node Updates
  // ═══════════════════════════════════════════════════════════════════════

  setSurfaceMenu: (surfaceId: string, menu: SelectMenu<TData>) => void
  setSurfaceFilteredNodes: (
    surfaceId: string,
    nodes: SelectNode<TData>[],
  ) => void
  setSurfaceDisplayNodes: (
    surfaceId: string,
    nodes: SelectNode<TData>[],
  ) => void
  updateSurfaceMenuDef: (
    surfaceId: string,
    menuDef: SelectMenuDef<TData>,
  ) => void

  // ═══════════════════════════════════════════════════════════════════════
  // Loading State
  // ═══════════════════════════════════════════════════════════════════════

  setSurfaceLoading: (surfaceId: string, isLoading: boolean) => void
  setSurfaceError: (surfaceId: string, error: Error | null) => void
  setSurfaceLoadingProgress: (
    surfaceId: string,
    progress: SelectSurfaceSlice<TData>['loadingProgress'],
  ) => void

  // ═══════════════════════════════════════════════════════════════════════
  // Focus
  // ═══════════════════════════════════════════════════════════════════════

  setFocusOwner: (surfaceId: string | null) => void

  // ═══════════════════════════════════════════════════════════════════════
  // Bulk Actions
  // ═══════════════════════════════════════════════════════════════════════

  closeAllSurfaces: () => void
  closeSurfacesFromDepth: (depth: number) => void

  // ═══════════════════════════════════════════════════════════════════════
  // Hover Actions (inherited from popup pattern)
  // ═══════════════════════════════════════════════════════════════════════

  setSurfaceHoveredId: (surfaceId: string, id: string | null) => void
  setSurfaceSuppressHoverOpen: (surfaceId: string, suppress: boolean) => void
  clearSurfaceSuppressHoverOpen: (surfaceId: string) => void

  // ═══════════════════════════════════════════════════════════════════════
  // Aim Guard Actions (inherited from popup pattern)
  // ═══════════════════════════════════════════════════════════════════════

  activateAimGuard: (
    triggerId: string,
    surfaceId: string,
    timeoutMs?: number,
  ) => void
  clearAimGuard: () => void
  isAimGuardBlocking: (rowId: string) => boolean

  // ═══════════════════════════════════════════════════════════════════════
  // Selection Actions (select-specific)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Set the selected value (single select mode).
   * Warns if called in multi-select mode.
   */
  setValue: (value: string | undefined) => void

  /**
   * Set the selected values (multi-select mode).
   * Warns if called in single-select mode.
   */
  setValues: (values: string[]) => void

  /**
   * Toggle a value in the selection.
   * In single mode: sets or clears the value.
   * In multi mode: adds if not present, removes if present.
   * Respects max/min constraints.
   */
  toggleValue: (value: string) => void

  /**
   * Check if a value is selected.
   */
  isSelected: (value: string) => boolean

  /**
   * Select all available values (multi-select mode).
   * Requires passing the available values since they may be filtered.
   */
  selectAll: (availableValues: string[]) => void

  /**
   * Clear all selections.
   * In multi mode, respects min constraint.
   */
  clearAll: () => void

  /**
   * Check if selection is at max capacity (multi-select mode).
   */
  isAtMax: () => boolean

  /**
   * Check if selection is at min capacity (multi-select mode).
   */
  isAtMin: () => boolean

  /**
   * Get the current selection count.
   */
  getSelectionCount: () => number
}

/* ================================================================================================
 * Complete Select Menu Store Type
 * ============================================================================================== */

/**
 * Complete select menu store type.
 */
export type SelectMenuStore<TData = unknown> = SelectMenuStoreState<TData> &
  SelectMenuStoreActions<TData>

/* ================================================================================================
 * Store Creation Options
 * ============================================================================================== */

/**
 * Options for creating a single-select store.
 */
export interface CreateSelectStoreOptions {
  scopeId: string
  dir?: 'ltr' | 'rtl'
  vimBindings?: boolean
  /** Initial selected value */
  defaultValue?: string
  /** Default aim guard timeout in milliseconds */
  aimGuardTimeoutMs?: number
}

/**
 * Options for creating a multi-select store.
 */
export interface CreateMultiSelectStoreOptions {
  scopeId: string
  dir?: 'ltr' | 'rtl'
  vimBindings?: boolean
  /** Initial selected values */
  defaultValues?: string[]
  /** Maximum number of selections allowed */
  max?: number
  /** Minimum number of selections required */
  min?: number
  /** Default aim guard timeout in milliseconds */
  aimGuardTimeoutMs?: number
}
