import * as React from 'react'
import { CLOSE_MENU_EVENT, dispatch } from '../lib/events.js'

export interface RootCloseContextValue {
  /** Close all surfaces (root + submenus) in depth order */
  closeAllSurfaces: () => void
  /** Register a surface with its depth (0 = root, 1+ = submenus) */
  registerSurface: (surfaceId: string, depth: number) => void
  /** Unregister a surface when it unmounts */
  unregisterSurface: (surfaceId: string) => void
}

const RootCloseContext = React.createContext<RootCloseContextValue | null>(null)

export interface RootCloseProviderProps {
  children: React.ReactNode
  onClose: () => void
}

/**
 * Provider for root close context. Tracks all open surfaces and provides
 * closeAllSurfaces function for Esc key and outside click handling.
 */
export function RootCloseProvider({
  children,
  onClose,
}: RootCloseProviderProps) {
  const openSurfaceIds = React.useRef<Map<string, number>>(new Map())

  const registerSurface = React.useCallback((surfaceId: string, depth: number) => {
    openSurfaceIds.current.set(surfaceId, depth)
  }, [])

  const unregisterSurface = React.useCallback((surfaceId: string) => {
    openSurfaceIds.current.delete(surfaceId)
  }, [])

  const closeAllSurfaces = React.useCallback(() => {
    // Sort surfaces by depth (deepest first)
    const ordered = [...openSurfaceIds.current.entries()].sort(
      (a, b) => b[1] - a[1],
    )

    // Dispatch close events to all surfaces
    for (const [surfaceId] of ordered) {
      const el = document.querySelector<HTMLElement>(
        `[data-surface-id="${surfaceId}"]`,
      )
      if (el) dispatch(el, CLOSE_MENU_EVENT)
    }

    // Close the root menu
    onClose()
  }, [onClose])

  const value = React.useMemo(
    () => ({
      closeAllSurfaces,
      registerSurface,
      unregisterSurface,
    }),
    [closeAllSurfaces, registerSurface, unregisterSurface],
  )

  return (
    <RootCloseContext.Provider value={value}>
      {children}
    </RootCloseContext.Provider>
  )
}

/**
 * Hook to access root close context.
 * Returns null if not within a RootCloseProvider (e.g., standalone usage).
 */
export function useRootClose(): RootCloseContextValue | null {
  return React.useContext(RootCloseContext)
}
