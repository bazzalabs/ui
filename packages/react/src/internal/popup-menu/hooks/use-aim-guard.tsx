'use client'

import { useValueAsRef } from '@base-ui/utils/useValueAsRef'
import * as React from 'react'
import { usePopupMenuDebug } from '../contexts/popup-menu-debug-context.js'

/**
 * Aim guard refs and actions. The value is stable for the provider's lifetime,
 * so rows can read it without re-rendering on every guard update.
 */
export interface AimGuardContextValue {
  activateAimGuard: (
    triggerId: string,
    depth: number,
    submenuSurfaceId: string,
    timeoutMs?: number,
  ) => void
  clearAimGuard: () => void
  aimGuardActiveRef: React.RefObject<boolean>
  guardedTriggerIdRef: React.RefObject<string | null>
  guardedDepthRef: React.RefObject<number | null>
  guardedSubmenuSurfaceIdRef: React.RefObject<string | null>
  isGuardBlocking: (rowId: string) => boolean
}

/** Aim guard state for components that render from it. */
export interface AimGuardStateContextValue {
  aimGuardActive: boolean
  guardedTriggerId: string | null
  guardedDepth: number | null
  guardedSubmenuSurfaceId: string | null
}

const AimGuardCtx = React.createContext<AimGuardContextValue>({
  activateAimGuard: () => {},
  clearAimGuard: () => {},
  aimGuardActiveRef: { current: false },
  guardedTriggerIdRef: { current: null },
  guardedDepthRef: { current: null },
  guardedSubmenuSurfaceIdRef: { current: null },
  isGuardBlocking: () => false,
})

const AimGuardStateCtx = React.createContext<AimGuardStateContextValue>({
  aimGuardActive: false,
  guardedTriggerId: null,
  guardedDepth: null,
  guardedSubmenuSurfaceId: null,
})

export const useAimGuard = () => React.useContext(AimGuardCtx)

/** Re-renders on every guard activate/clear; prefer `useAimGuard` refs. */
export const useAimGuardState = () => React.useContext(AimGuardStateCtx)

export interface AimGuardProviderProps {
  children: React.ReactNode
}

/**
 * Provides aim guard for safe polygon navigation.
 * Prevents accidental submenu closures when users move diagonally toward an open submenu.
 */
export function AimGuardProvider({ children }: AimGuardProviderProps) {
  const { logAimGuardEvents } = usePopupMenuDebug()
  // Read through a ref so toggling logging doesn't change the callbacks below
  const logAimGuardEventsRef = useValueAsRef(logAimGuardEvents)
  const [aimGuardActive, setAimGuardActive] = React.useState(false)
  const [guardedTriggerId, setGuardedTriggerId] = React.useState<string | null>(
    null,
  )
  const [guardedDepth, setGuardedDepth] = React.useState<number | null>(null)
  const [guardedSubmenuSurfaceId, setGuardedSubmenuSurfaceId] = React.useState<
    string | null
  >(null)
  const aimGuardActiveRef = React.useRef(false)
  const guardedTriggerIdRef = React.useRef<string | null>(null)
  const guardedDepthRef = React.useRef<number | null>(null)
  const guardedSubmenuSurfaceIdRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    aimGuardActiveRef.current = aimGuardActive
  }, [aimGuardActive])

  React.useEffect(() => {
    guardedTriggerIdRef.current = guardedTriggerId
  }, [guardedTriggerId])

  React.useEffect(() => {
    guardedDepthRef.current = guardedDepth
  }, [guardedDepth])

  React.useEffect(() => {
    guardedSubmenuSurfaceIdRef.current = guardedSubmenuSurfaceId
  }, [guardedSubmenuSurfaceId])

  const guardTimerRef = React.useRef<number | null>(null)

  const logAimGuard = React.useCallback(
    (eventName: string, details?: Record<string, unknown>) => {
      if (!logAimGuardEventsRef.current || typeof window === 'undefined') {
        return
      }

      console.log(`[PopupMenu][AimGuardProvider] ${eventName}`, {
        aimGuardActive: aimGuardActiveRef.current,
        guardedTriggerId: guardedTriggerIdRef.current,
        guardedDepth: guardedDepthRef.current,
        guardedSubmenuSurfaceId: guardedSubmenuSurfaceIdRef.current,
        ...details,
      })
    },
    [logAimGuardEventsRef],
  )

  const resetAimGuardState = React.useCallback(() => {
    aimGuardActiveRef.current = false
    guardedTriggerIdRef.current = null
    guardedDepthRef.current = null
    guardedSubmenuSurfaceIdRef.current = null
    setAimGuardActive(false)
    setGuardedTriggerId(null)
    setGuardedDepth(null)
    setGuardedSubmenuSurfaceId(null)
  }, [])

  const clearAimGuard = React.useCallback(() => {
    if (guardTimerRef.current !== null) {
      window.clearTimeout(guardTimerRef.current)
      guardTimerRef.current = null
    }
    logAimGuard('clear')
    resetAimGuardState()
  }, [resetAimGuardState, logAimGuard])

  const activateAimGuard = React.useCallback(
    (
      triggerId: string,
      depth: number,
      submenuSurfaceId: string,
      timeoutMs = 450,
    ) => {
      logAimGuard('activate', {
        triggerId,
        depth,
        submenuSurfaceId,
        timeoutMs,
      })
      aimGuardActiveRef.current = true
      guardedTriggerIdRef.current = triggerId
      guardedDepthRef.current = depth
      guardedSubmenuSurfaceIdRef.current = submenuSurfaceId
      setGuardedTriggerId(triggerId)
      setGuardedDepth(depth)
      setGuardedSubmenuSurfaceId(submenuSurfaceId)
      setAimGuardActive(true)
      if (guardTimerRef.current !== null) {
        window.clearTimeout(guardTimerRef.current)
      }
      guardTimerRef.current = window.setTimeout(() => {
        logAimGuard('timeout-expired', {
          triggerId,
          depth,
          submenuSurfaceId,
        })
        resetAimGuardState()
        guardTimerRef.current = null
      }, timeoutMs) as unknown as number
    },
    [resetAimGuardState, logAimGuard],
  )

  React.useEffect(() => {
    return () => {
      if (guardTimerRef.current !== null) {
        window.clearTimeout(guardTimerRef.current)
        guardTimerRef.current = null
      }

      logAimGuard('provider-unmount-clear')
    }
  }, [logAimGuard])

  const isGuardBlocking = React.useCallback(
    (rowId: string) =>
      aimGuardActiveRef.current && guardedTriggerIdRef.current !== rowId,
    [],
  )

  const value = React.useMemo(
    () => ({
      activateAimGuard,
      clearAimGuard,
      aimGuardActiveRef,
      guardedTriggerIdRef,
      guardedDepthRef,
      guardedSubmenuSurfaceIdRef,
      isGuardBlocking,
    }),
    [activateAimGuard, clearAimGuard, isGuardBlocking],
  )

  const stateValue = React.useMemo(
    () => ({
      aimGuardActive,
      guardedTriggerId,
      guardedDepth,
      guardedSubmenuSurfaceId,
    }),
    [aimGuardActive, guardedTriggerId, guardedDepth, guardedSubmenuSurfaceId],
  )

  return (
    <AimGuardCtx.Provider value={value}>
      <AimGuardStateCtx.Provider value={stateValue}>
        {children}
      </AimGuardStateCtx.Provider>
    </AimGuardCtx.Provider>
  )
}

export { AimGuardCtx, AimGuardStateCtx }
