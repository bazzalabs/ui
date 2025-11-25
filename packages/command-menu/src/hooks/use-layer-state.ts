import * as React from 'react'
import { useCommandMenuStoreApi } from '../store/index.js'

export interface UseLayerStateResult {
  /** Query state for this layer */
  query: string
  /** Set query for this layer */
  setQuery: (query: string) => void
  /** Surface ID for this layer */
  surfaceId: string
}

/**
 * Hook for managing per-layer state (query).
 * Each layer maintains its own independent query state, matching popup menu architecture.
 */
export function useLayerState(
  menuId: string | undefined,
  visible: boolean,
  depth: number,
): UseLayerStateResult {
  // Each layer has its own independent query state (matching popup menu)
  const [query, setQuery] = React.useState('')

  // Get the global command menu store
  const globalStore = useCommandMenuStoreApi()

  // Surface ID for this layer
  const surfaceId = menuId ?? 'root'

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
      globalStore.getState().first(surfaceId, 'keyboard')
    }
    prevVisibleRef.current = visible
  }, [visible, globalStore, surfaceId])

  return {
    query,
    setQuery,
    surfaceId,
  }
}
