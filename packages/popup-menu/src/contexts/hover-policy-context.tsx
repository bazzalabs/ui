import * as React from 'react'
import type { HoverPolicy } from '../types.js'

const HoverPolicyCtx = React.createContext<HoverPolicy>({
  suppressHoverOpen: false,
  clearSuppression: () => {},
  aimGuardActive: false,
  guardedTriggerId: null,
  activateAimGuard: () => {},
  clearAimGuard: () => {},
  aimGuardActiveRef: React.createRef<boolean>(),
  guardedTriggerIdRef: React.createRef(),
  isGuardBlocking: () => false,
})

export const useHoverPolicy = () => React.useContext(HoverPolicyCtx)

export interface HoverPolicyProviderProps {
  children: React.ReactNode
  suppressHoverOpenOnMount?: boolean
}

/**
 * Provides hover policy including aim guard for safe polygon navigation.
 */
export function HoverPolicyProvider({
  children,
  suppressHoverOpenOnMount = false,
}: HoverPolicyProviderProps) {
  const [suppressHoverOpen, setSuppressHoverOpen] = React.useState(
    suppressHoverOpenOnMount,
  )
  const clearSuppression = React.useCallback(() => {
    if (suppressHoverOpen) setSuppressHoverOpen(false)
  }, [suppressHoverOpen])

  const [aimGuardActive, setAimGuardActive] = React.useState(false)
  const [guardedTriggerId, setGuardedTriggerId] = React.useState<string | null>(
    null,
  )
  const aimGuardActiveRef = React.useRef(false)
  const guardedTriggerIdRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    aimGuardActiveRef.current = aimGuardActive
  }, [aimGuardActive])

  React.useEffect(() => {
    guardedTriggerIdRef.current = guardedTriggerId
  }, [guardedTriggerId])

  const guardTimerRef = React.useRef<number | null>(null)

  const clearAimGuard = React.useCallback(() => {
    if (guardTimerRef.current) {
      window.clearTimeout(guardTimerRef.current)
      guardTimerRef.current = null
    }
    aimGuardActiveRef.current = false
    guardedTriggerIdRef.current = null
    setAimGuardActive(false)
    setGuardedTriggerId(null)
  }, [])

  const activateAimGuard = React.useCallback(
    (triggerId: string, timeoutMs = 450) => {
      aimGuardActiveRef.current = true
      guardedTriggerIdRef.current = triggerId
      setGuardedTriggerId(triggerId)
      setAimGuardActive(true)
      if (guardTimerRef.current) window.clearTimeout(guardTimerRef.current)
      guardTimerRef.current = window.setTimeout(() => {
        aimGuardActiveRef.current = false
        guardedTriggerIdRef.current = null
        setAimGuardActive(false)
        setGuardedTriggerId(null)
        guardTimerRef.current = null
      }, timeoutMs) as any
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
      suppressHoverOpen,
      clearSuppression,
      aimGuardActive,
      guardedTriggerId,
      activateAimGuard,
      clearAimGuard,
      aimGuardActiveRef,
      guardedTriggerIdRef,
      isGuardBlocking,
    }),
    [
      suppressHoverOpen,
      clearSuppression,
      aimGuardActive,
      guardedTriggerId,
      activateAimGuard,
      clearAimGuard,
      isGuardBlocking,
    ],
  )

  return (
    <HoverPolicyCtx.Provider value={value}>{children}</HoverPolicyCtx.Provider>
  )
}

export { HoverPolicyCtx }
