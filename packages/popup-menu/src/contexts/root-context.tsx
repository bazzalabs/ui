import * as React from 'react'
import { CLOSE_MENU_EVENT, dispatch } from '../lib/events.js'
import type { InteractionGuardProps } from '../components/interaction-guard.js'

export interface RootContextValue {
  /** Unique scope ID for this menu instance */
  scopeId: string
  /** Close all surfaces (root + submenus) in depth order */
  closeAllSurfaces: () => void
  /** Register a surface with its depth (0 = root, 1+ = submenus) */
  registerSurface: (surfaceId: string, depth: number) => void
  /** Unregister a surface when it unmounts */
  unregisterSurface: (surfaceId: string) => void
  /** InteractionGuard options for the root menu */
  interactionGuardOptions?: Partial<
    Omit<InteractionGuardProps, 'scopeId' | 'asChild' | 'children'>
  >
}

const RootContext = React.createContext<RootContextValue | null>(null)

export interface RootProviderProps {
  children: React.ReactNode
  scopeId: string
  onClose: () => void
  /** InteractionGuard options for the root menu */
  interactionGuardOptions?: Partial<
    Omit<InteractionGuardProps, 'scopeId' | 'asChild' | 'children'>
  >
}

/**
 * Provider for root context. Provides the scope ID and close functionality for the menu instance.
 */
export function RootProvider({
  children,
  scopeId,
  onClose,
  interactionGuardOptions,
}: RootProviderProps) {
  const openSurfaceIds = React.useRef<Map<string, number>>(new Map())

  const registerSurface = React.useCallback(
    (surfaceId: string, depth: number) => {
      openSurfaceIds.current.set(surfaceId, depth)
    },
    [],
  )

  const unregisterSurface = React.useCallback((surfaceId: string) => {
    openSurfaceIds.current.delete(surfaceId)
  }, [])

  const closeAllSurfaces = React.useCallback(() => {
    // Sort surfaces by depth (deepest first)
    const ordered = [...openSurfaceIds.current.entries()].sort(
      (a, b) => b[1] - a[1],
    )

    // Dispatch close events to all surfaces (submenus listen and close themselves)
    for (const [surfaceId] of ordered) {
      const el = document.querySelector<HTMLElement>(
        `[data-surface-id="${surfaceId}"]`,
      )
      if (el) {
        console.log('[Root] closing surface', surfaceId)
        dispatch(el, CLOSE_MENU_EVENT)
      }
    }

    // Close the root menu
    onClose()
  }, [onClose])

  const value = React.useMemo(
    () => ({
      scopeId,
      closeAllSurfaces,
      registerSurface,
      unregisterSurface,
      interactionGuardOptions,
    }),
    [
      scopeId,
      closeAllSurfaces,
      registerSurface,
      unregisterSurface,
      interactionGuardOptions,
    ],
  )

  return <RootContext.Provider value={value}>{children}</RootContext.Provider>
}

/**
 * Hook to access root context.
 * @throws {Error} if used outside RootProvider
 */
export function useRoot(): RootContextValue {
  const ctx = React.useContext(RootContext)
  if (!ctx) {
    throw new Error('useRoot must be used within a RootProvider')
  }
  return ctx
}
