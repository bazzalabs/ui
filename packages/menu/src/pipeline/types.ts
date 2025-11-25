import type * as React from 'react'
import type { MenuControl } from '../control.js'
import type { FilterMode } from '../hooks/use-filtered-nodes.js'
import type {
  AggregatedLoaderState,
  AsyncNodeLoaderResult,
  Menu,
  MenuNodeDefaults,
  Node,
  RootMenuDef,
  SubmenuDef,
} from '../types.js'

/* ================================================================================================
 * Pipeline Configuration
 * ============================================================================================== */

/**
 * Configuration for the menu pipeline.
 * This is the input to useMenuPipeline.
 */
export interface MenuPipelineConfig<T = unknown> {
  /**
   * The menu definition to render.
   */
  menuDef: RootMenuDef<T> | SubmenuDef<T>

  /**
   * Whether the menu is currently open.
   */
  open: boolean

  /**
   * Unique identifier for this surface.
   * @default 'root'
   */
  surfaceId?: string

  /**
   * Whether this is a submenu.
   * When true, deep search injection is skipped.
   * @default false
   */
  isSubmenu?: boolean

  /**
   * Pre-computed defaults from factory + instance levels.
   */
  defaults?: MenuNodeDefaults<T>

  /**
   * Optional control instance for programmatic menu manipulation.
   */
  control?: MenuControl<T>

  /**
   * Query override (controlled mode).
   * When provided, the internal query state is bypassed.
   */
  query?: string

  /**
   * Callback when query changes (controlled mode).
   */
  onQueryChange?: (query: string) => void

  /**
   * Filter mode for nodes.
   * - 'shallow': Only return top-level nodes (for action menus, dropdowns)
   * - 'deep': Include nested submenu children (for command menus with deep search)
   * @default Determined by query: 'deep' when query exists, 'shallow' otherwise
   */
  filterMode?: FilterMode | ((query: string) => FilterMode)
}

/* ================================================================================================
 * Pipeline Phase Results
 * ============================================================================================== */

/**
 * Result from the input state phase.
 */
export interface InputPhaseResult {
  /**
   * Whether the input is currently active (visible/focused).
   */
  inputActive: boolean

  /**
   * Set the input active state.
   */
  setInputActive: React.Dispatch<React.SetStateAction<boolean>>

  /**
   * The current query string.
   */
  query: string

  /**
   * Set the query string.
   */
  setQuery: React.Dispatch<React.SetStateAction<string>>
}

/**
 * Result from the loader phase.
 */
export interface LoaderPhaseResult<T = unknown> {
  /**
   * The root loader result (if menu has a loader).
   */
  rootLoaderResult: AsyncNodeLoaderResult<T> | undefined

  /**
   * Aggregated state from deep search loaders.
   */
  aggregatedState: AggregatedLoaderState | null

  /**
   * Whether streaming mode is enabled.
   */
  streamingEnabled: boolean

  /**
   * The order in which loaders completed.
   */
  completionOrder: string[]
}

/**
 * Result from the menu instantiation phase.
 */
export interface MenuPhaseResult<T = unknown> {
  /**
   * The instantiated menu with all results injected.
   */
  menu: Menu<T>
}

/**
 * Result from the filtering phase.
 */
export interface FilterPhaseResult<T = unknown> {
  /**
   * Filtered nodes matching the query.
   */
  filteredNodes: Node<T>[]

  /**
   * Display nodes ready for rendering.
   * Includes loading nodes in streaming mode.
   */
  displayNodes: Node<T>[]
}

/* ================================================================================================
 * Pipeline Result
 * ============================================================================================== */

/**
 * Complete result from the menu pipeline.
 * Contains all state and actions needed to render a menu.
 */
export interface MenuPipelineResult<T = unknown> {
  // === Input State ===
  /**
   * Whether the input is currently active (visible/focused).
   */
  inputActive: boolean

  /**
   * Set the input active state.
   */
  setInputActive: React.Dispatch<React.SetStateAction<boolean>>

  /**
   * The current query string.
   */
  query: string

  /**
   * Set the query string.
   */
  setQuery: (query: string) => void

  // === Menu State ===
  /**
   * The instantiated menu with all results injected.
   */
  menu: Menu<T>

  /**
   * Display nodes ready for rendering.
   */
  displayNodes: Node<T>[]

  /**
   * Filtered nodes (before loading node appended).
   */
  filteredNodes: Node<T>[]

  // === Loading State ===
  /**
   * Whether streaming mode is enabled.
   */
  streamingEnabled: boolean

  /**
   * Aggregated state from all loaders.
   */
  aggregatedState: AggregatedLoaderState | null

  /**
   * The order in which loaders completed.
   */
  completionOrder: string[]

  // === Metadata ===
  /**
   * Surface ID for this pipeline instance.
   */
  surfaceId: string

  /**
   * Whether this is a submenu.
   */
  isSubmenu: boolean
}
