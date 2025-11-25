import type {
  BaseMenuStoreActions,
  BaseMenuStoreState,
  MenuSurfaceSlice,
} from '@bazza-ui/menu'
import type { PopupMenu, PopupMenuDef, PopupNode } from '../types.js'

/* ================================================================================================
 * Popup-Specific Surface State Extension
 * ============================================================================================== */

/**
 * Extended surface state for popup menus.
 * Adds hover and aim guard tracking per surface.
 */
export type PopupSurfaceSlice<TData = unknown> = MenuSurfaceSlice<
  TData,
  PopupMenuDef<TData>,
  PopupMenu<TData>,
  PopupNode<TData>
> & {
  // Hover state for this surface (submenus can have independent hover behavior)
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
 * Popup Menu Store State Extension
 * ============================================================================================== */

/**
 * Aim guard state - global across the menu tree.
 * Protects submenu traversal when user is moving toward an open submenu.
 */
export type AimGuardState = {
  /** Whether aim guard is currently active */
  active: boolean
  /** ID of the trigger being guarded (the submenu trigger the user is moving toward) */
  guardedTriggerId: string | null
  /** Surface ID that owns the guarded trigger */
  guardedSurfaceId: string | null
  /** Timeout ID for auto-clearing the guard */
  timeoutId: number | null
}

/**
 * Extended store state for popup menus.
 */
export type PopupMenuStoreState<TData = unknown> = Omit<
  BaseMenuStoreState<
    TData,
    PopupMenuDef<TData>,
    PopupMenu<TData>,
    PopupNode<TData>
  >,
  'surfaces'
> & {
  /** Surface registry with popup-specific extensions */
  surfaces: Map<string, PopupSurfaceSlice<TData>>
  /** Global aim guard state */
  aimGuard: AimGuardState
}

/* ================================================================================================
 * Popup Menu Store Actions Extension
 * ============================================================================================== */

/**
 * Extended store actions for popup menus.
 */
export type PopupMenuStoreActions<TData = unknown> = BaseMenuStoreActions<
  TData,
  PopupMenuDef<TData>,
  PopupMenu<TData>,
  PopupNode<TData>
> & {
  // Hover actions
  setSurfaceHoveredId: (surfaceId: string, id: string | null) => void
  setSurfaceSuppressHoverOpen: (surfaceId: string, suppress: boolean) => void
  clearSurfaceSuppressHoverOpen: (surfaceId: string) => void

  // Aim guard actions
  activateAimGuard: (
    triggerId: string,
    surfaceId: string,
    timeoutMs?: number,
  ) => void
  clearAimGuard: () => void
  /** Check if aim guard is blocking activation of a specific row */
  isAimGuardBlocking: (rowId: string) => boolean
}

/* ================================================================================================
 * Complete Popup Menu Store Type
 * ============================================================================================== */

/**
 * Complete popup menu store type.
 */
export type PopupMenuStore<TData = unknown> = PopupMenuStoreState<TData> &
  PopupMenuStoreActions<TData>

/* ================================================================================================
 * Store Creation Options
 * ============================================================================================== */

/**
 * Options for creating a popup menu store.
 */
export interface CreatePopupMenuStoreOptions {
  scopeId: string
  dir?: 'ltr' | 'rtl'
  vimBindings?: boolean
  /** Default aim guard timeout in milliseconds */
  aimGuardTimeoutMs?: number
}
