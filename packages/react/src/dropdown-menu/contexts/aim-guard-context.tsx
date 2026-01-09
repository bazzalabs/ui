'use client'

import * as React from 'react'

export interface AimGuardContextValue {
  aimGuardActive: boolean
  guardedTriggerId: string | null
  guardedDepth: number | null
  activateAimGuard: (
    triggerId: string,
    depth: number,
    timeoutMs?: number,
  ) => void
  clearAimGuard: () => void
  aimGuardActiveRef: React.RefObject<boolean>
  guardedTriggerIdRef: React.RefObject<string | null>
  guardedDepthRef: React.RefObject<number | null>
  isGuardBlocking: (rowId: string) => boolean
}

const AimGuardCtx = React.createContext<AimGuardContextValue>({
  aimGuardActive: false,
  guardedTriggerId: null,
  guardedDepth: null,
  activateAimGuard: () => {},
  clearAimGuard: () => {},
  aimGuardActiveRef: { current: false },
  guardedTriggerIdRef: { current: null },
  guardedDepthRef: { current: null },
  isGuardBlocking: () => false,
})

export const useAimGuard = () => React.useContext(AimGuardCtx)

export interface AimGuardProviderProps {
  children: React.ReactNode
}

/**
 * Provides aim guard for safe polygon navigation.
 * Prevents accidental submenu closures when users move diagonally toward an open submenu.
 */
export function AimGuardProvider({ children }: AimGuardProviderProps) {
  const [aimGuardActive, setAimGuardActive] = React.useState(false)
  const [guardedTriggerId, setGuardedTriggerId] = React.useState<string | null>(
    null,
  )
  const [guardedDepth, setGuardedDepth] = React.useState<number | null>(null)
  const aimGuardActiveRef = React.useRef(false)
  const guardedTriggerIdRef = React.useRef<string | null>(null)
  const guardedDepthRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    aimGuardActiveRef.current = aimGuardActive
  }, [aimGuardActive])

  React.useEffect(() => {
    guardedTriggerIdRef.current = guardedTriggerId
  }, [guardedTriggerId])

  React.useEffect(() => {
    guardedDepthRef.current = guardedDepth
  }, [guardedDepth])

  const guardTimerRef = React.useRef<number | null>(null)

  const clearAimGuard = React.useCallback(() => {
    if (guardTimerRef.current) {
      window.clearTimeout(guardTimerRef.current)
      guardTimerRef.current = null
    }
    aimGuardActiveRef.current = false
    guardedTriggerIdRef.current = null
    guardedDepthRef.current = null
    setAimGuardActive(false)
    setGuardedTriggerId(null)
    setGuardedDepth(null)
  }, [])

  const activateAimGuard = React.useCallback(
    (triggerId: string, depth: number, timeoutMs = 450) => {
      aimGuardActiveRef.current = true
      guardedTriggerIdRef.current = triggerId
      guardedDepthRef.current = depth
      setGuardedTriggerId(triggerId)
      setGuardedDepth(depth)
      setAimGuardActive(true)
      if (guardTimerRef.current) window.clearTimeout(guardTimerRef.current)
      guardTimerRef.current = window.setTimeout(() => {
        aimGuardActiveRef.current = false
        guardedTriggerIdRef.current = null
        guardedDepthRef.current = null
        setAimGuardActive(false)
        setGuardedTriggerId(null)
        setGuardedDepth(null)
        guardTimerRef.current = null
      }, timeoutMs) as unknown as number
    },
    [],
  )

  const isGuardBlocking = React.useCallback(
    (rowId: string) =>
      aimGuardActiveRef.current && guardedTriggerIdRef.current !== rowId,
    [],
  )

  const value = React.useMemo(
    () => ({
      aimGuardActive,
      guardedTriggerId,
      guardedDepth,
      activateAimGuard,
      clearAimGuard,
      aimGuardActiveRef,
      guardedTriggerIdRef,
      guardedDepthRef,
      isGuardBlocking,
    }),
    [
      aimGuardActive,
      guardedTriggerId,
      guardedDepth,
      activateAimGuard,
      clearAimGuard,
      isGuardBlocking,
    ],
  )

  return <AimGuardCtx.Provider value={value}>{children}</AimGuardCtx.Provider>
}

export { AimGuardCtx }
