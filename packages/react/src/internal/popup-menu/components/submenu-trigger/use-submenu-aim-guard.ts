'use client'

import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect'
import type {
  AimGuardDebugSnapshot,
  AimGuardTrigger,
  AimGuardTriggerOptions,
} from '@bazza-ui/menu-core'
import * as React from 'react'
import { useMaybeMenuTreeTier } from '../../contexts/menu-tree-context.js'
import {
  type PopupMenuSafeTriangleAreaDebugSettings,
  usePopupMenuDebug,
} from '../../contexts/popup-menu-debug-context.js'

export interface SubmenuAimGuardParams {
  triggerId: string
  triggerStoreId: string
  /** The depth of the menu the trigger is in. */
  parentDepth: number
  childSurfaceId: string
  contentRef: React.RefObject<HTMLElement | null>
  triggerRef: React.RefObject<HTMLElement | null>
}

export interface SubmenuAimGuardBinding {
  /** The trigger's side of the tree's aim guard, for its controller. */
  aimGuard: AimGuardTrigger
  /** Records the pointer's trail while it is over the trigger. */
  holdHoverTrail: () => void
  releaseHoverTrail: () => void
  /** The safe triangle the debug overlay shows, if any. */
  safeTriangle: {
    config: PopupMenuSafeTriangleAreaDebugSettings
    snapshot: AimGuardDebugSnapshot
  } | null
}

const subscribeToNothing = () => () => {}

/**
 * A submenu trigger's side of its tree's `AimGuardController`, on the DOM:
 * the rects it reads the pointer against (the trigger's, its popup's), and
 * the overlay, which the controller works out only while the debug flag is
 * on and this subscribes.
 */
export function useSubmenuAimGuard(
  params: SubmenuAimGuardParams,
): SubmenuAimGuardBinding {
  const {
    triggerId,
    triggerStoreId,
    parentDepth,
    childSurfaceId,
    contentRef,
    triggerRef,
  } = params

  const guard = useMaybeMenuTreeTier()?.aimGuard
  if (!guard) {
    throw new Error('SubmenuTrigger must be used within a menu root')
  }

  const options: AimGuardTriggerOptions = React.useMemo(
    () => ({
      triggerId,
      depth: parentDepth,
      submenuSurfaceId: childSurfaceId,
      getPopupRect: () => contentRef.current?.getBoundingClientRect() ?? null,
      getTriggerRect: () => triggerRef.current?.getBoundingClientRect() ?? null,
      logDetails: () => ({ triggerStoreId }),
    }),
    [
      triggerId,
      triggerStoreId,
      parentDepth,
      childSurfaceId,
      contentRef,
      triggerRef,
    ],
  )
  const [aimGuard] = React.useState(() => guard.trigger(options))
  useIsoLayoutEffect(() => {
    aimGuard.configure(options)
  }, [aimGuard, options])

  React.useEffect(() => () => aimGuard.dispose(), [aimGuard])

  const { showSafeTriangleArea } = usePopupMenuDebug()
  const enabled = showSafeTriangleArea.enabled
  const subscribe = React.useMemo(
    () =>
      enabled
        ? (listener: () => void) => aimGuard.subscribeDebug(listener)
        : subscribeToNothing,
    [aimGuard, enabled],
  )
  const getSnapshot = React.useCallback(
    () => (enabled ? aimGuard.getDebugSnapshot() : null),
    [aimGuard, enabled],
  )
  const snapshot = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  )

  const holdHoverTrail = React.useCallback(
    () => aimGuard.holdTrail('hover'),
    [aimGuard],
  )
  const releaseHoverTrail = React.useCallback(
    () => aimGuard.releaseTrail('hover'),
    [aimGuard],
  )

  const safeTriangle = React.useMemo(
    () => (snapshot ? { config: showSafeTriangleArea, snapshot } : null),
    [snapshot, showSafeTriangleArea],
  )

  return { aimGuard, holdHoverTrail, releaseHoverTrail, safeTriangle }
}
