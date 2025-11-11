import type { SurfaceState, SurfaceStore } from '../types.js'

export function useSurfaceSel<T, K>(
  store: SurfaceStore<T>,
  selector: (s: SurfaceState) => K,
): K {
  // Check if this is a Zustand-backed store (has __useStore)
  const useStore = (store as any).__useStore

  return useStore((state: any) => selector(state.state))

  // Fallback for non-Zustand stores (backward compatibility)
  // const selectorRef = React.useRef(selector)
  // const lastResultRef = React.useRef<K | undefined>(undefined)

  // React.useEffect(() => {
  //   selectorRef.current = selector
  // })

  // const getSnapshot = React.useCallback(() => {
  //   const nextResult = selectorRef.current(store.snapshot())

  //   if (
  //     lastResultRef.current === undefined ||
  //     !Object.is(lastResultRef.current, nextResult)
  //   ) {
  //     lastResultRef.current = nextResult
  //   }

  //   return lastResultRef.current as K
  // }, [store])

  // return React.useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot)
}
