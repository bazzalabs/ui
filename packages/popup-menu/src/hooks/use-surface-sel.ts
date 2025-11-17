import type { SurfaceStore } from '@bazza-ui/menu'

/**
 * Reactive hook that subscribes to a specific slice of the surface store state.
 * This hook ensures components re-render when the selected state changes.
 *
 * @example
 * const activeId = useSurfaceSel(store, (s) => s.activeId)
 * const focused = activeId === rowId
 */
export function useSurfaceSel<T, K>(
  store: SurfaceStore<T>,
  selector: (s: any) => K,
): K {
  // Access the internal Zustand store
  const useStore = (store as any).__useStore

  // Subscribe to the selector
  return useStore((state: any) => selector(state.state))
}
