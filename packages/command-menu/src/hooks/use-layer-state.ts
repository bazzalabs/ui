import { createSurfaceStore, type SurfaceStore } from '@bazza-ui/menu'
import * as React from 'react'

export interface UseLayerStateResult<T> {
  /** Query state for this layer */
  query: string
  /** Set query for this layer */
  setQuery: (query: string) => void
  /** Surface store for this layer */
  store: SurfaceStore<T>
}

/**
 * Hook for managing per-layer state (query + store).
 * Each layer maintains its own independent query state, matching popup menu architecture.
 */
export function useLayerState<T>(
  menuId: string | undefined,
  visible: boolean,
  depth: number,
): UseLayerStateResult<T> {
  // Each layer has its own independent query state (matching popup menu)
  const [query, setQuery] = React.useState('')

  // Create a surface store for this menu layer
  const store = React.useMemo(() => createSurfaceStore<T>(), [menuId])

  // Clear query when this layer becomes visible (navigating into it)
  React.useEffect(() => {
    if (visible && depth > 0) {
      setQuery('')
    }
  }, [visible, depth])

  // Reset active ID to first item when this layer becomes visible (navigating back)
  const prevVisibleRef = React.useRef(visible)
  React.useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      // Layer just became visible - reset to first item
      store.first('keyboard')
    }
    prevVisibleRef.current = visible
  }, [visible, store])

  return {
    query,
    setQuery,
    store,
  }
}
