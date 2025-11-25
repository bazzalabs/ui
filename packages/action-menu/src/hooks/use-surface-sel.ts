import * as React from 'react'
import type { SurfaceState, SurfaceStore } from '../types.js'

export function useSurfaceSel<T, K>(
  store: SurfaceStore<T>,
  selector: (s: SurfaceState) => K,
): K {
  // Use React state with store subscription for reactivity
  const [value, setValue] = React.useState(() => selector(store.snapshot()))

  React.useEffect(() => {
    // Initial value
    setValue(selector(store.snapshot()))

    // Subscribe to changes
    const unsubscribe = store.subscribe(() => {
      setValue(selector(store.snapshot()))
    })

    return unsubscribe
  }, [store, selector])

  return value
}
