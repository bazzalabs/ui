import type { Menu, MenuPipelineResult, Node } from '@bazza-ui/menu'
import * as React from 'react'

/**
 * Minimal store actions interface for surface effects.
 * This allows the hook to work with any store that provides these methods.
 */
export interface SurfaceEffectsStoreActions {
  setSurfaceMenu: (surfaceId: string, menu: any) => void
  setSurfaceDisplayNodes: (surfaceId: string, nodes: any[]) => void
  setSurfaceQuery: (surfaceId: string, query: string) => void
  setSurfaceInputActive: (surfaceId: string, active: boolean) => void
  setSurfaceLoading: (surfaceId: string, loading: boolean) => void
  setSurfaceError: (surfaceId: string, error: Error | null) => void
}

/**
 * Configuration for surface effects.
 */
export interface UseSurfaceEffectsConfig<T = unknown> {
  /**
   * Surface ID for this surface.
   */
  surfaceId: string

  /**
   * Whether the menu is open.
   */
  open: boolean

  /**
   * Whether this is a submenu.
   */
  isSubmenu: boolean

  /**
   * The instantiated menu.
   */
  menu: Menu<T>

  /**
   * Display nodes ready for rendering.
   */
  displayNodes: Node<T>[]

  /**
   * Current query string.
   */
  query: string

  /**
   * Whether input is active.
   */
  inputActive: boolean

  /**
   * Store actions for syncing state.
   */
  storeActions: SurfaceEffectsStoreActions

  /**
   * Callback to register surface with root context.
   */
  registerSurface: (surfaceId: string, depth: number) => void

  /**
   * Callback to unregister surface from root context.
   */
  unregisterSurface: (surfaceId: string) => void
}

/**
 * Consolidated effect hook for popup menu surfaces.
 *
 * This hook replaces the scattered useEffects in Surface with a single,
 * organized effect management layer. It handles:
 *
 * 1. Surface registration with root context
 * 2. Syncing menu state to global store
 * 3. Syncing display nodes to global store
 * 4. Syncing query to global store
 * 5. Syncing input active state to global store
 * 6. Syncing loading state to global store
 *
 * Focus management is intentionally NOT included here as it requires
 * DOM refs and is better handled separately.
 *
 * @example
 * ```tsx
 * useSurfaceEffects({
 *   surfaceId,
 *   open,
 *   isSubmenu,
 *   menu: pipeline.menu,
 *   displayNodes: pipeline.displayNodes,
 *   query: pipeline.query,
 *   inputActive: pipeline.inputActive,
 *   storeActions,
 *   registerSurface: rootCtx.registerSurface,
 *   unregisterSurface: rootCtx.unregisterSurface,
 * })
 * ```
 */
export function useSurfaceEffects<T = unknown>(
  config: UseSurfaceEffectsConfig<T>,
): void {
  const {
    surfaceId,
    open,
    isSubmenu,
    menu,
    displayNodes,
    query,
    inputActive,
    storeActions,
    registerSurface,
    unregisterSurface,
  } = config

  // ============================================================================
  // Effect 1: Surface Registration
  // ============================================================================
  React.useEffect(() => {
    if (!open) return

    const depth = isSubmenu ? 1 : 0 // TODO: cleaner depth tracking
    registerSurface(surfaceId, depth)

    return () => {
      unregisterSurface(surfaceId)
    }
  }, [open, surfaceId, isSubmenu, registerSurface, unregisterSurface])

  // ============================================================================
  // Effect 2: Sync Menu to Store
  // ============================================================================
  React.useEffect(() => {
    if (!open) return
    storeActions.setSurfaceMenu(surfaceId, menu as any)
  }, [storeActions, surfaceId, menu, open])

  // ============================================================================
  // Effect 3: Sync Display Nodes to Store
  // ============================================================================
  React.useEffect(() => {
    if (!open) return
    storeActions.setSurfaceDisplayNodes(surfaceId, displayNodes as any)
  }, [storeActions, surfaceId, displayNodes, open])

  // ============================================================================
  // Effect 4: Sync Query to Store
  // ============================================================================
  React.useEffect(() => {
    if (!open) return
    storeActions.setSurfaceQuery(surfaceId, query)
  }, [storeActions, surfaceId, query, open])

  // ============================================================================
  // Effect 5: Sync Input Active to Store
  // ============================================================================
  React.useEffect(() => {
    if (!open) return
    storeActions.setSurfaceInputActive(surfaceId, inputActive)
  }, [storeActions, surfaceId, inputActive, open])

  // ============================================================================
  // Effect 6: Sync Loading State to Store
  // ============================================================================
  React.useEffect(() => {
    if (!open) return

    const loadingState = menu.loadingState
    if (loadingState) {
      const isLoading = loadingState.isLoading ?? false
      storeActions.setSurfaceLoading(surfaceId, isLoading)

      if (loadingState.error) {
        storeActions.setSurfaceError(surfaceId, loadingState.error)
      }
    }
  }, [storeActions, surfaceId, menu.loadingState, open])
}

/**
 * Helper hook that accepts a MenuPipelineResult directly.
 * This is a convenience wrapper around useSurfaceEffects.
 */
export function usePipelineEffects<T = unknown>(
  pipeline: MenuPipelineResult<T>,
  config: {
    open: boolean
    storeActions: SurfaceEffectsStoreActions
    registerSurface: (surfaceId: string, depth: number) => void
    unregisterSurface: (surfaceId: string) => void
  },
): void {
  useSurfaceEffects({
    surfaceId: pipeline.surfaceId,
    open: config.open,
    isSubmenu: pipeline.isSubmenu,
    menu: pipeline.menu,
    displayNodes: pipeline.displayNodes,
    query: pipeline.query,
    inputActive: pipeline.inputActive,
    storeActions: config.storeActions,
    registerSurface: config.registerSurface,
    unregisterSurface: config.unregisterSurface,
  })
}
