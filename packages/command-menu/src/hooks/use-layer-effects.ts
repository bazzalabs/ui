import type { ActivationCause, Menu, Node } from '@bazza-ui/menu'
import * as React from 'react'

/**
 * Minimal store actions interface for layer effects.
 * This allows the hook to work with any store that provides these methods.
 */
export interface LayerEffectsStoreActions {
  registerSurface: (
    surfaceId: string,
    opts: { depth: number; parentId?: string | null; menuDef?: any },
  ) => void
  unregisterSurface: (surfaceId: string) => void
  setSurfaceMenu: (surfaceId: string, menu: any) => void
  setSurfaceDisplayNodes: (surfaceId: string, nodes: any[]) => void
  setSurfaceQuery: (surfaceId: string, query: string) => void
  setSurfaceActiveId: (
    surfaceId: string,
    id: string | null,
    cause?: ActivationCause,
  ) => void
  setSurfaceLoading: (surfaceId: string, loading: boolean) => void
  setSurfaceError: (surfaceId: string, error: Error | null) => void
}

/**
 * Configuration for layer effects.
 */
export interface UseLayerEffectsConfig<T = unknown> {
  /**
   * Surface ID for this layer.
   */
  surfaceId: string

  /**
   * Depth of this layer (0 for root, 1+ for submenus).
   */
  depth: number

  /**
   * Whether this layer is visible.
   */
  visible: boolean

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
   * Store actions for syncing state.
   */
  storeActions: LayerEffectsStoreActions
}

/**
 * Consolidated effect hook for command menu layers.
 *
 * This hook handles syncing layer state to the global store:
 * 1. Register/unregister surface
 * 2. Sync menu to store
 * 3. Sync display nodes to store
 * 4. Sync query to store
 * 5. Sync loading state to store
 *
 * @example
 * ```tsx
 * useLayerEffects({
 *   surfaceId,
 *   visible,
 *   menu: pipeline.menu,
 *   displayNodes: pipeline.displayNodes,
 *   query: pipeline.query,
 *   storeActions,
 * })
 * ```
 */
export function useLayerEffects<T = unknown>(
  config: UseLayerEffectsConfig<T>,
): void {
  const { surfaceId, depth, visible, menu, displayNodes, query, storeActions } =
    config

  // ============================================================================
  // Effect 1: Register/Unregister Surface (useLayoutEffect to run before other effects)
  // Keep surface registered even when hidden - only unregister on unmount.
  // This preserves refs and state when navigating between submenus.
  // ============================================================================
  React.useLayoutEffect(() => {
    // Register the surface on mount
    storeActions.registerSurface(surfaceId, { depth })

    // Unregister only on unmount
    return () => {
      storeActions.unregisterSurface(surfaceId)
    }
  }, [storeActions, surfaceId, depth])

  // ============================================================================
  // Effect 1b: Set Initial Active ID
  // ============================================================================
  const hasSetInitialActiveIdRef = React.useRef(false)

  // Reset the ref when visibility changes to false (layer hidden)
  React.useEffect(() => {
    if (!visible) {
      hasSetInitialActiveIdRef.current = false
    }
  }, [visible])

  React.useEffect(() => {
    if (!visible) return

    // Only set initial active ID once per visibility cycle
    if (hasSetInitialActiveIdRef.current) return

    // Set initial active ID to first valid item
    const validRows = displayNodes.filter(
      (n) =>
        (n.kind === 'item' || n.kind === 'submenu') && !(n as any).disabled,
    )

    if (validRows.length > 0) {
      hasSetInitialActiveIdRef.current = true
      storeActions.setSurfaceActiveId(surfaceId, validRows[0]!.id, 'keyboard')
    }
  }, [visible, storeActions, surfaceId, displayNodes])

  // ============================================================================
  // Effect 2: Sync Menu to Store
  // ============================================================================
  React.useEffect(() => {
    if (!visible) return
    storeActions.setSurfaceMenu(surfaceId, menu as any)
  }, [storeActions, surfaceId, menu, visible])

  // ============================================================================
  // Effect 2: Sync Display Nodes to Store
  // ============================================================================
  React.useEffect(() => {
    if (!visible) return
    storeActions.setSurfaceDisplayNodes(surfaceId, displayNodes as any)
  }, [storeActions, surfaceId, displayNodes, visible])

  // ============================================================================
  // Effect 3: Sync Query to Store
  // ============================================================================
  React.useEffect(() => {
    if (!visible) return
    storeActions.setSurfaceQuery(surfaceId, query)
  }, [storeActions, surfaceId, query, visible])

  // ============================================================================
  // Effect 4: Sync Loading State to Store
  // ============================================================================
  React.useEffect(() => {
    if (!visible) return

    const loadingState = menu.loadingState
    if (loadingState) {
      const isLoading = loadingState.isLoading ?? false
      storeActions.setSurfaceLoading(surfaceId, isLoading)

      if (loadingState.error) {
        storeActions.setSurfaceError(surfaceId, loadingState.error)
      }
    }
  }, [storeActions, surfaceId, menu.loadingState, visible])
}
