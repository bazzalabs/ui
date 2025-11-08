import * as React from 'react'
import type { SurfaceState, SurfaceStore } from '../types.js'

export function useSurfaceSel<T, K>(
  store: SurfaceStore<T>,
  selector: (s: SurfaceState) => K,
): K {
  const get = React.useCallback(
    () => selector(store.snapshot()),
    [store, selector],
  )
  return React.useSyncExternalStore(store.subscribe, get, get)
}
