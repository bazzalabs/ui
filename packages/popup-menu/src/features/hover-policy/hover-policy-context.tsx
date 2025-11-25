import * as React from 'react'
import { usePopupMenuActions, usePopupMenuStore } from '../../store/index.js'
import type { HoverPolicy } from '../../types.js'

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
  /** Surface ID for surface-specific hover suppression */
  surfaceId?: string
}

/**
 * Provides hover policy including aim guard for safe polygon navigation.
 * Now integrated with the global PopupMenuStore for state management.
 */
export function HoverPolicyProvider({
  children,
  suppressHoverOpenOnMount = false,
  surfaceId = 'root',
}: HoverPolicyProviderProps) {
  // Get store state and actions
  const storeActions = usePopupMenuActions()
  const aimGuardState = usePopupMenuStore((state) => state.aimGuard)

  // Local state for suppression (per-surface)
  const [suppressHoverOpen, setSuppressHoverOpen] = React.useState(
    suppressHoverOpenOnMount,
  )

  const clearSuppression = React.useCallback(() => {
    if (suppressHoverOpen) {
      setSuppressHoverOpen(false)
      storeActions.clearSurfaceSuppressHoverOpen(surfaceId)
    }
  }, [suppressHoverOpen, storeActions, surfaceId])

  // Sync local suppression state to store
  React.useEffect(() => {
    storeActions.setSurfaceSuppressHoverOpen(surfaceId, suppressHoverOpen)
  }, [storeActions, surfaceId, suppressHoverOpen])

  // Use store's aim guard state
  const aimGuardActive = aimGuardState.active
  const guardedTriggerId = aimGuardState.guardedTriggerId

  // Refs for synchronous access (important for mouse event handlers)
  const aimGuardActiveRef = React.useRef(aimGuardActive)
  const guardedTriggerIdRef = React.useRef(guardedTriggerId)

  React.useEffect(() => {
    aimGuardActiveRef.current = aimGuardActive
  }, [aimGuardActive])

  React.useEffect(() => {
    guardedTriggerIdRef.current = guardedTriggerId
  }, [guardedTriggerId])

  // Wrap store actions with local ref updates for synchronous access
  const activateAimGuard = React.useCallback(
    (triggerId: string, timeoutMs = 450) => {
      aimGuardActiveRef.current = true
      guardedTriggerIdRef.current = triggerId
      storeActions.activateAimGuard(triggerId, surfaceId, timeoutMs)
    },
    [storeActions, surfaceId],
  )

  const clearAimGuard = React.useCallback(() => {
    aimGuardActiveRef.current = false
    guardedTriggerIdRef.current = null
    storeActions.clearAimGuard()
  }, [storeActions])

  const isGuardBlocking = React.useCallback(
    (rowId: string) => storeActions.isAimGuardBlocking(rowId),
    [storeActions],
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
