'use client'

import { useStableCallback } from '@base-ui/utils/useStableCallback'
import type {
  Point,
  SubmenuAim,
  SubmenuAimDecision,
  SubmenuAimGuard,
} from '@bazza-ui/menu-core'
import * as React from 'react'
import {
  type PopupMenuSafeTriangleAreaDebugSettings,
  usePopupMenuDebug,
} from '../../contexts/popup-menu-debug-context.js'
import { useAimGuard, useAimGuardState } from '../../hooks/use-aim-guard.js'
import {
  type AnchorSide,
  getSmoothedHeading,
  resolveAnchorSide,
  willHitSubmenu,
} from '../../utils/aim-guard.js'
import { isMouseLikePointerType } from '../../utils/is-mouse-like-pointer.js'
import { useMouseTrail } from '../../utils/use-mouse-trail.js'
import type { PopupMenuSubmenuSafeTriangleTone } from './submenu-safe-triangle-area.js'

type SafeTriangleDebugState = 'hidden' | PopupMenuSubmenuSafeTriangleTone

export interface SafeTriangleDebugSnapshot {
  contentRect: DOMRect
  triggerRect: DOMRect | null
  pointerX: number
  pointerY: number
}

/** Where the pointer left the trigger, for the moves that follow. */
interface Exit {
  anchor: AnchorSide
  triggerRect: DOMRect | null
  x: number
  y: number
}

export interface SubmenuAimGuardParams {
  triggerId: string
  triggerStoreId: string
  /** The depth of the menu the trigger is in. */
  parentDepth: number
  childSurfaceId: string
  open: boolean
  contentRef: React.RefObject<HTMLElement | null>
  triggerRef: React.RefObject<HTMLElement | null>
}

export interface SubmenuAimGuardBinding {
  /** The tree's aim guard and its geometry, for the submenu's controller. */
  aimGuard: SubmenuAimGuard
  /** Records the pointer's trail while it is over the trigger. */
  holdHoverTrail: () => void
  releaseHoverTrail: () => void
  /** The safe triangle the debug overlay shows, if any. */
  safeTriangle: {
    config: PopupMenuSafeTriangleAreaDebugSettings
    tone: PopupMenuSubmenuSafeTriangleTone
    snapshot: SafeTriangleDebugSnapshot | null
  } | null
}

/** The log line for what the controller made of an aim, as it was named. */
function decisionTrace(
  phase: 'leave' | 'track',
  aim: SubmenuAim,
  decision: 'hit' | 'miss',
): string {
  if (phase === 'leave') {
    if (aim.type === 'inside') return 'pointerleave-inside-popup-success'
    return decision === 'hit'
      ? 'pointerleave-hit-activate-guard'
      : 'pointerleave-miss-close'
  }
  if (decision === 'hit') return 'leave-monitor-hit-transition'
  return aim.type === 'outside' && aim.movedAway
    ? 'leave-monitor-reversal-close'
    : 'leave-monitor-miss-transition'
}

const isInside = (rect: DOMRect, x: number, y: number) =>
  x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom

/**
 * The tree's aim guard (`AimGuardStore`) and the menu-core aim geometry,
 * behind the interface a `SubmenuController` takes; with the pointer trail
 * the geometry reads, and the logs. It reads geometry only; the safe-triangle
 * debug overlay shows what the controller made of it (`show`).
 */
export function useSubmenuAimGuard(
  params: SubmenuAimGuardParams,
): SubmenuAimGuardBinding {
  const {
    triggerId,
    triggerStoreId,
    parentDepth,
    childSurfaceId,
    open,
    contentRef,
    triggerRef,
  } = params

  const {
    aimGuardActiveRef,
    guardedTriggerIdRef,
    guardedDepthRef,
    activateAimGuard,
    clearAimGuard,
  } = useAimGuard()
  const { aimGuardActive, guardedTriggerId, guardedDepth } = useAimGuardState()

  // Track mouse positions for aim guard trajectory calculation, only while
  // this trigger holds the trail: while hovered, and while its exit is
  // tracked
  const { trailRef, hold: holdTrail, release: releaseTrail } = useMouseTrail(4)

  const { showSafeTriangleArea, logAimGuardEvents } = usePopupMenuDebug()
  const showSafeTriangleAreaEnabled = showSafeTriangleArea.enabled
  const [debugState, setDebugState] =
    React.useState<SafeTriangleDebugState>('hidden')
  const [debugSnapshot, setDebugSnapshot] =
    React.useState<SafeTriangleDebugSnapshot | null>(null)
  const missTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const exitRef = React.useRef<Exit | null>(null)

  // Pass `details` as a function from per-move call sites, so nothing is
  // built while logging is off
  const logAimTrace = useStableCallback(
    (
      eventName: string,
      details?: Record<string, unknown> | (() => Record<string, unknown>),
    ) => {
      if (!logAimGuardEvents) {
        return
      }

      console.log(`[PopupMenu][AimGuard] ${eventName}`, {
        triggerId,
        triggerStoreId,
        parentDepth,
        aimGuardActive: aimGuardActiveRef.current,
        guardedTriggerId: guardedTriggerIdRef.current,
        guardedDepth: guardedDepthRef.current,
        ...(typeof details === 'function' ? details() : details),
      })
    },
  )

  const clearMissTimer = React.useCallback(() => {
    if (missTimerRef.current !== null) {
      clearTimeout(missTimerRef.current)
      missTimerRef.current = null
    }
  }, [])

  React.useEffect(() => clearMissTimer, [clearMissTimer])

  const hideTriangle = useStableCallback(() => {
    clearMissTimer()
    setDebugState('hidden')
    setDebugSnapshot(null)
  })

  const showActivated = useStableCallback(
    (snapshot: SafeTriangleDebugSnapshot) => {
      if (!showSafeTriangleAreaEnabled) {
        return
      }

      clearMissTimer()
      setDebugSnapshot(
        showSafeTriangleArea.freezeOnPointerLeave ? snapshot : null,
      )
      setDebugState('activated')
    },
  )

  const showMissed = useStableCallback(
    (snapshot: SafeTriangleDebugSnapshot) => {
      clearMissTimer()

      if (!showSafeTriangleAreaEnabled || !showSafeTriangleArea.showMissState) {
        setDebugState('hidden')
        setDebugSnapshot(null)
        return
      }

      setDebugState('missed')
      setDebugSnapshot(snapshot)

      const hideAfter = showSafeTriangleArea.missFreezeDuration
      if (hideAfter <= 0) {
        setDebugState('hidden')
        setDebugSnapshot(null)
        return
      }

      missTimerRef.current = setTimeout(() => {
        missTimerRef.current = null
        setDebugState('hidden')
        setDebugSnapshot(null)
      }, hideAfter)
    },
  )

  React.useEffect(() => {
    if (showSafeTriangleAreaEnabled) {
      return
    }
    hideTriangle()
  }, [showSafeTriangleAreaEnabled, hideTriangle])

  React.useEffect(() => {
    if (
      !showSafeTriangleAreaEnabled ||
      showSafeTriangleArea.persistOnSuccess ||
      debugState !== 'activated'
    ) {
      return
    }

    const isGuardActiveForThisTrigger =
      aimGuardActive &&
      guardedTriggerId === triggerId &&
      guardedDepth === parentDepth

    if (!isGuardActiveForThisTrigger) {
      hideTriangle()
    }
  }, [
    showSafeTriangleAreaEnabled,
    showSafeTriangleArea.persistOnSuccess,
    debugState,
    aimGuardActive,
    guardedTriggerId,
    guardedDepth,
    triggerId,
    parentDepth,
    hideTriangle,
  ])

  React.useEffect(() => {
    if (debugState !== 'activated' || open) {
      return
    }
    hideTriangle()
  }, [debugState, open, hideTriangle])

  const isBlocked = useStableCallback(
    () =>
      aimGuardActiveRef.current &&
      guardedDepthRef.current === parentDepth &&
      guardedTriggerIdRef.current !== triggerId,
  )

  // What the last leave or exit move read, for the overlay and the logs
  const lastAimRef = React.useRef<{
    phase: 'leave' | 'track'
    aim: SubmenuAim
    snapshot: SafeTriangleDebugSnapshot | null
  } | null>(null)

  const show = useStableCallback((decision: SubmenuAimDecision) => {
    if (decision === 'hover') {
      logAimTrace('pointerenter-submenu-trigger')
      if (!showSafeTriangleAreaEnabled) return
      clearMissTimer()
      setDebugSnapshot(null)
      setDebugState('hover')
      return
    }

    const last = lastAimRef.current
    if (decision === 'none' || !last?.snapshot) {
      hideTriangle()
      return
    }
    logAimTrace(decisionTrace(last.phase, last.aim, decision))
    if (decision === 'hit') {
      showActivated(last.snapshot)
    } else {
      showMissed(last.snapshot)
    }
  })

  const leave = useStableCallback((point: Point): SubmenuAim => {
    const { x: clientX, y: clientY } = point
    logAimTrace('pointerleave-submenu-trigger', { clientX, clientY })
    const read = (
      aim: SubmenuAim,
      snapshot: SafeTriangleDebugSnapshot | null,
    ): SubmenuAim => {
      lastAimRef.current = { phase: 'leave', aim, snapshot }
      return aim
    }

    // Get the submenu content rect for safe polygon calculation
    const contentRect = contentRef.current?.getBoundingClientRect()
    if (!contentRect) {
      logAimTrace('pointerleave-no-content-rect')
      return read({ type: 'no-popup' }, null)
    }

    const tRect = triggerRef.current?.getBoundingClientRect() ?? null
    const snapshot: SafeTriangleDebugSnapshot = {
      contentRect,
      triggerRect: tRect,
      pointerX: clientX,
      pointerY: clientY,
    }

    // The pointer can already be inside the popup (fast movement,
    // overlapping elements)
    if (isInside(contentRect, clientX, clientY)) {
      return read({ type: 'inside' }, snapshot)
    }

    // Calculate safe polygon and check if user is aiming toward submenu
    const anchor = resolveAnchorSide(contentRect, tRect, clientX, clientY)
    // A fast pass can leave a single sample; the leave point gives the
    // heading its second point instead of falling back to aiming at the
    // submenu
    const trail = trailRef.current
    const heading = getSmoothedHeading(
      trail.length < 2 ? [...trail, [clientX, clientY]] : trail,
      clientX,
      clientY,
      anchor,
      tRect,
      contentRect,
    )
    // An empty trail means the pointer never moved over the trigger: the
    // trigger moved under it (scrolling, a layout shift), so nothing says
    // it is aiming at the submenu
    const hit =
      trail.length > 0 &&
      willHitSubmenu(clientX, clientY, heading, contentRect, anchor, tRect)

    logAimTrace('pointerleave-hit-eval', {
      anchor,
      hit,
      clientX,
      clientY,
      heading,
    })

    exitRef.current = { anchor, triggerRect: tRect, x: clientX, y: clientY }
    return read({ type: 'outside', hit, movedAway: false }, snapshot)
  })

  const track = useStableCallback((point: Point): SubmenuAim => {
    const contentRect = contentRef.current?.getBoundingClientRect()
    const exit = exitRef.current
    if (!contentRect || !exit) {
      logAimTrace('leave-monitor-stop-no-content-rect')
      lastAimRef.current = null
      return { type: 'no-popup' }
    }

    const { x: clientX, y: clientY } = point
    const { anchor, triggerRect } = exit
    const axisDelta =
      anchor === 'left' || anchor === 'right'
        ? clientX - exit.x
        : clientY - exit.y
    exit.x = clientX
    exit.y = clientY
    const snapshot: SafeTriangleDebugSnapshot = {
      contentRect,
      triggerRect,
      pointerX: clientX,
      pointerY: clientY,
    }

    if (isInside(contentRect, clientX, clientY)) {
      logAimTrace('leave-monitor-inside-popup', { clientX, clientY })
      lastAimRef.current = { phase: 'track', aim: { type: 'inside' }, snapshot }
      return { type: 'inside' }
    }

    const movedAway =
      (anchor === 'left' && axisDelta <= -2) ||
      (anchor === 'right' && axisDelta >= 2) ||
      (anchor === 'top' && axisDelta <= -2) ||
      (anchor === 'bottom' && axisDelta >= 2)

    const heading = getSmoothedHeading(
      trailRef.current,
      clientX,
      clientY,
      anchor,
      triggerRect,
      contentRect,
    )
    const hit = willHitSubmenu(
      clientX,
      clientY,
      heading,
      contentRect,
      anchor,
      triggerRect,
    )

    logAimTrace('leave-monitor-pointermove', () => ({
      anchor,
      clientX,
      clientY,
      axisDelta,
      movedAway,
      hit,
      heading,
    }))

    const aim: SubmenuAim = { type: 'outside', hit, movedAway }
    lastAimRef.current = { phase: 'track', aim, snapshot }
    return aim
  })

  const watch = useStableCallback((onMove: (point: Point) => void) => {
    logAimTrace('leave-monitor-start', () => ({ ...exitRef.current }))

    const onWindowPointerMove = (event: PointerEvent) => {
      if (!isMouseLikePointerType(event.pointerType)) {
        return
      }
      onMove({ x: event.clientX, y: event.clientY })
    }

    // Keep the trail running for the heading checks. Held before the
    // listener is added, so each move reaches the trail first.
    holdTrail('monitor')
    window.addEventListener('pointermove', onWindowPointerMove, {
      passive: true,
    })

    return () => {
      logAimTrace('leave-monitor-cleanup-remove-listener')
      window.removeEventListener('pointermove', onWindowPointerMove)
      releaseTrail('monitor')
    }
  })

  const hold = useStableCallback((timeoutMs: number) => {
    activateAimGuard(triggerId, parentDepth, childSurfaceId, timeoutMs)
  })

  const releaseOwn = useStableCallback(() => {
    if (
      aimGuardActiveRef.current &&
      guardedTriggerIdRef.current === triggerId &&
      guardedDepthRef.current === parentDepth
    ) {
      clearAimGuard()
    }
  })

  const aimGuard: SubmenuAimGuard = React.useMemo(
    () => ({
      isBlocked,
      leave,
      track,
      watch,
      hold,
      release: clearAimGuard,
      releaseOwn,
      show,
    }),
    [isBlocked, leave, track, watch, hold, clearAimGuard, releaseOwn, show],
  )

  const holdHoverTrail = React.useCallback(
    () => holdTrail('hover'),
    [holdTrail],
  )
  const releaseHoverTrail = React.useCallback(
    () => releaseTrail('hover'),
    [releaseTrail],
  )

  const tone = debugState === 'hidden' ? null : debugState
  const safeTriangle = React.useMemo(
    () =>
      showSafeTriangleAreaEnabled && tone !== null
        ? { config: showSafeTriangleArea, tone, snapshot: debugSnapshot }
        : null,
    [showSafeTriangleAreaEnabled, showSafeTriangleArea, tone, debugSnapshot],
  )

  return { aimGuard, holdHoverTrail, releaseHoverTrail, safeTriangle }
}
