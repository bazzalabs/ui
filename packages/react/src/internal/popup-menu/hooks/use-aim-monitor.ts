'use client'

import * as React from 'react'
import { usePopupMenuDebug } from '../contexts/popup-menu-debug-context.js'
import {
  type AnchorSide,
  getSmoothedHeading,
  resolveAnchorSide,
  willHitSubmenu,
} from '../utils/aim-guard.js'
import { isMouseLikePointerType } from '../utils/is-mouse-like-pointer.js'
import { useMouseTrail } from '../utils/use-mouse-trail.js'

export type AimMonitorDebugState = 'hidden' | 'hover' | 'activated' | 'missed'
export type AimMonitorAnchorMode = 'anchor-rect' | 'pointer'
/** `'inside-at-leave'`: the leave point itself was inside the content (no monitor ran). `'inside-content'`: a later move entered the content. `'cancel'`: `cancel()` was called. */
export type AimMonitorSettleCause =
  | 'inside-at-leave'
  | 'inside-content'
  | 'cancel'

export interface AimMonitorSnapshot {
  contentRect: DOMRect
  anchorRect: DOMRect | null
  pointerX: number
  pointerY: number
  anchor: AnchorSide
}

export interface AimMonitorPointerEvent {
  clientX: number
  clientY: number
  pointerType?: string
  /** `'leave'` (default): a real pointerleave/mouseleave — the layout-induced rule applies. `'reevaluate'`: the adapter asks for a fresh decision from the current pointer position (e.g. a submenu closed while the pointer rests outside); the layout-induced rule is skipped. */
  source?: 'leave' | 'reevaluate'
}

export interface UseAimMonitorParams {
  getContentRect: () => DOMRect | null
  getAnchorRect: () => DOMRect | null
  anchorMode: AimMonitorAnchorMode
  closeDelay: number
  closeOnPointerLeave: boolean
  onHit?: (snapshot: AimMonitorSnapshot) => void
  onMiss?: (snapshot: AimMonitorSnapshot) => void
  onClose: () => void
  onSettled?: (cause: AimMonitorSettleCause) => void
  logContext?: () => Record<string, unknown>
}

export interface AimMonitorDebug {
  readonly state: AimMonitorDebugState
  readonly snapshot: AimMonitorSnapshot | null
  markHover: () => void
  reset: () => void
}

export interface UseAimMonitorReturn {
  pointerLeft: (event: AimMonitorPointerEvent) => void
  cancel: () => void
  isActive: () => boolean
  debug: AimMonitorDebug
}

export const HIT_MONITOR_LIFETIME_MS = 600
export const REVERSAL_THRESHOLD_PX = 2
export const TRAIL_LENGTH = 4

/** Watches pointer trajectory after leaving a popup and coordinates its close decision. */
export function useAimMonitor(
  params: UseAimMonitorParams,
): UseAimMonitorReturn {
  const paramsRef = React.useRef(params)
  paramsRef.current = params
  const { showSafeTriangleArea, logAimGuardEvents } = usePopupMenuDebug()
  const trailRef = useMouseTrail(TRAIL_LENGTH)
  const lastPointerRef = React.useRef<{ x: number; y: number } | null>(null)
  const monitorCleanupRef = React.useRef<(() => void) | null>(null)
  const monitorTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const monitorActiveRef = React.useRef(false)
  const debugStateRef = React.useRef<AimMonitorDebugState>('hidden')
  const debugSnapshotRef = React.useRef<AimMonitorSnapshot | null>(null)
  const missTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [, render] = React.useReducer((value) => value + 1, 0)

  const setDebug = React.useCallback(
    (state: AimMonitorDebugState, snapshot: AimMonitorSnapshot | null) => {
      if (
        debugStateRef.current === state &&
        debugSnapshotRef.current === snapshot
      )
        return
      debugStateRef.current = state
      debugSnapshotRef.current = snapshot
      render()
    },
    [],
  )

  const log = React.useCallback(
    (eventName: string, details?: Record<string, unknown>) => {
      if (!logAimGuardEvents) return
      console.log(`[PopupMenu][AimMonitor] ${eventName}`, {
        ...paramsRef.current.logContext?.(),
        ...details,
      })
    },
    [logAimGuardEvents],
  )

  const clearClose = React.useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const clearMissTimer = React.useCallback(() => {
    if (missTimerRef.current !== null) {
      clearTimeout(missTimerRef.current)
      missTimerRef.current = null
    }
  }, [])

  const resetDebug = React.useCallback(() => {
    clearMissTimer()
    setDebug('hidden', null)
  }, [clearMissTimer, setDebug])

  const showActivated = React.useCallback(
    (snapshot: AimMonitorSnapshot) => {
      if (!showSafeTriangleArea.enabled) return
      clearMissTimer()
      setDebug(
        'activated',
        showSafeTriangleArea.freezeOnPointerLeave ? snapshot : null,
      )
    },
    [
      clearMissTimer,
      setDebug,
      showSafeTriangleArea.enabled,
      showSafeTriangleArea.freezeOnPointerLeave,
    ],
  )

  const showMissed = React.useCallback(
    (snapshot: AimMonitorSnapshot) => {
      clearMissTimer()
      if (
        !showSafeTriangleArea.enabled ||
        !showSafeTriangleArea.showMissState
      ) {
        setDebug('hidden', null)
        return
      }
      setDebug('missed', snapshot)
      const duration = showSafeTriangleArea.missFreezeDuration
      if (duration <= 0) {
        setDebug('hidden', null)
        return
      }
      missTimerRef.current = setTimeout(() => {
        missTimerRef.current = null
        setDebug('hidden', null)
      }, duration)
    },
    [
      clearMissTimer,
      setDebug,
      showSafeTriangleArea.enabled,
      showSafeTriangleArea.showMissState,
      showSafeTriangleArea.missFreezeDuration,
    ],
  )

  const armClose = React.useCallback(() => {
    const current = paramsRef.current
    if (!current.closeOnPointerLeave) return
    clearClose()
    if (current.closeDelay <= 0) {
      current.onClose()
      return
    }
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null
      paramsRef.current.onClose()
    }, current.closeDelay)
  }, [clearClose])

  const stopMonitor = React.useCallback(() => {
    monitorActiveRef.current = false
    monitorCleanupRef.current?.()
    monitorCleanupRef.current = null
    if (monitorTimerRef.current !== null) {
      clearTimeout(monitorTimerRef.current)
      monitorTimerRef.current = null
    }
  }, [])

  const startMonitor = React.useCallback(
    (
      initialHit: boolean | null,
      lifetime: number | null,
      initialX: number,
      initialY: number,
      fixedAnchor: AnchorSide | null,
      fixedAnchorRect: DOMRect | null,
    ) => {
      stopMonitor()
      monitorActiveRef.current = true
      const armLifetime = (monitorLifetime: number) => {
        monitorTimerRef.current = setTimeout(() => {
          monitorTimerRef.current = null
          log('monitor-expired', { lifetime: monitorLifetime })
          stopMonitor()
        }, monitorLifetime)
      }
      let lastHit = initialHit
      let previousX = initialX
      let previousY = initialY
      const onMove = (event: PointerEvent) => {
        if (!isMouseLikePointerType(event.pointerType)) return
        const current = paramsRef.current
        const contentRect = current.getContentRect()
        if (!contentRect) {
          log('monitor-stop-no-content-rect')
          stopMonitor()
          return
        }
        const { clientX, clientY } = event
        if (
          clientX >= contentRect.left &&
          clientX <= contentRect.right &&
          clientY >= contentRect.top &&
          clientY <= contentRect.bottom
        ) {
          log('monitor-inside-content', { clientX, clientY })
          clearClose()
          stopMonitor()
          current.onSettled?.('inside-content')
          return
        }
        const anchorRect = current.getAnchorRect()
        const anchor =
          fixedAnchor ??
          (current.anchorMode === 'anchor-rect'
            ? resolveAnchorSide(contentRect, anchorRect, clientX, clientY)
            : resolveAnchorSide(contentRect, null, clientX, clientY))
        const heading = getSmoothedHeading(
          trailRef.current,
          clientX,
          clientY,
          anchor,
          current.anchorMode === 'anchor-rect'
            ? (fixedAnchorRect ?? anchorRect)
            : null,
          contentRect,
        )
        const hit = willHitSubmenu(
          clientX,
          clientY,
          heading,
          contentRect,
          anchor,
          anchorRect,
        )
        const snapshot = {
          contentRect,
          anchorRect,
          pointerX: clientX,
          pointerY: clientY,
          anchor,
        }
        if (lastHit === null) {
          if (trailRef.current.length < 2) return
          lastHit = hit
          if (hit) {
            showActivated(snapshot)
            clearClose()
            current.onHit?.(snapshot)
            log('monitor-hit', { anchor, clientX, clientY })
            armLifetime(HIT_MONITOR_LIFETIME_MS)
          } else {
            showMissed(snapshot)
            current.onMiss?.(snapshot)
            log('monitor-miss', { anchor, clientX, clientY })
            armClose()
            if (current.closeDelay <= 0 || !current.closeOnPointerLeave) {
              stopMonitor()
            } else {
              armLifetime(current.closeDelay)
            }
          }
          previousX = clientX
          previousY = clientY
          return
        }
        const axisDelta =
          anchor === 'left' || anchor === 'right'
            ? clientX - previousX
            : clientY - previousY
        previousX = clientX
        previousY = clientY
        const movedAway =
          (anchor === 'left' && axisDelta <= -REVERSAL_THRESHOLD_PX) ||
          (anchor === 'right' && axisDelta >= REVERSAL_THRESHOLD_PX) ||
          (anchor === 'top' && axisDelta <= -REVERSAL_THRESHOLD_PX) ||
          (anchor === 'bottom' && axisDelta >= REVERSAL_THRESHOLD_PX)
        if (lastHit && movedAway) {
          lastHit = false
          showMissed(snapshot)
          current.onMiss?.(snapshot)
          log('monitor-reversal', { anchor, clientX, clientY })
          armClose()
          if (current.closeDelay <= 0 || !current.closeOnPointerLeave)
            stopMonitor()
          return
        }
        if (hit === lastHit) return
        lastHit = hit
        if (hit) {
          showActivated(snapshot)
          clearClose()
          current.onHit?.(snapshot)
          log('monitor-hit', { anchor, clientX, clientY })
        } else {
          showMissed(snapshot)
          current.onMiss?.(snapshot)
          log('monitor-miss', { anchor, clientX, clientY })
          armClose()
          if (current.closeDelay <= 0 || !current.closeOnPointerLeave)
            stopMonitor()
        }
      }
      window.addEventListener('pointermove', onMove, { passive: true })
      monitorCleanupRef.current = () =>
        window.removeEventListener('pointermove', onMove)
      log('monitor-start', { initialHit, lifetime })
      if (lifetime !== null) armLifetime(lifetime)
    },
    [
      armClose,
      clearClose,
      log,
      showActivated,
      showMissed,
      stopMonitor,
      trailRef,
    ],
  )

  const pointerLeft = React.useCallback(
    (event: AimMonitorPointerEvent) => {
      if (!isMouseLikePointerType(event.pointerType)) return
      stopMonitor()
      const current = paramsRef.current
      const contentRect = current.getContentRect()
      if (!contentRect) {
        log('leave-no-content-rect')
        resetDebug()
        armClose()
        return
      }
      const anchorRect = current.getAnchorRect()
      const anchor =
        current.anchorMode === 'anchor-rect'
          ? resolveAnchorSide(
              contentRect,
              anchorRect,
              event.clientX,
              event.clientY,
            )
          : resolveAnchorSide(contentRect, null, event.clientX, event.clientY)
      const snapshot = {
        contentRect,
        anchorRect,
        pointerX: event.clientX,
        pointerY: event.clientY,
        anchor,
      }
      const inside =
        event.clientX >= contentRect.left &&
        event.clientX <= contentRect.right &&
        event.clientY >= contentRect.top &&
        event.clientY <= contentRect.bottom
      if (inside) {
        log('leave-inside-content', {
          clientX: event.clientX,
          clientY: event.clientY,
        })
        showActivated(snapshot)
        clearClose()
        current.onSettled?.('inside-at-leave')
        return
      }
      const last = lastPointerRef.current
      if (
        event.source !== 'reevaluate' &&
        last !== null &&
        last.x === event.clientX &&
        last.y === event.clientY
      ) {
        log('leave-without-movement', {
          clientX: event.clientX,
          clientY: event.clientY,
        })
        trailRef.current.length = 0
        trailRef.current.push([event.clientX, event.clientY])
        startMonitor(
          null,
          null,
          event.clientX,
          event.clientY,
          current.anchorMode === 'anchor-rect' ? anchor : null,
          anchorRect,
        )
        return
      }
      const heading = getSmoothedHeading(
        trailRef.current,
        event.clientX,
        event.clientY,
        anchor,
        current.anchorMode === 'anchor-rect' ? anchorRect : null,
        contentRect,
      )
      const hit = willHitSubmenu(
        event.clientX,
        event.clientY,
        heading,
        contentRect,
        anchor,
        anchorRect,
      )
      if (hit) {
        showActivated(snapshot)
        clearClose()
        current.onHit?.(snapshot)
        startMonitor(
          true,
          HIT_MONITOR_LIFETIME_MS,
          event.clientX,
          event.clientY,
          current.anchorMode === 'anchor-rect' ? anchor : null,
          anchorRect,
        )
        log('leave-hit', { anchor })
      } else {
        showMissed(snapshot)
        current.onMiss?.(snapshot)
        armClose()
        log('leave-miss', { anchor })
        if (current.closeOnPointerLeave && current.closeDelay > 0)
          startMonitor(
            false,
            current.closeDelay,
            event.clientX,
            event.clientY,
            current.anchorMode === 'anchor-rect' ? anchor : null,
            anchorRect,
          )
      }
    },
    [
      armClose,
      clearClose,
      log,
      resetDebug,
      showActivated,
      showMissed,
      startMonitor,
      stopMonitor,
      trailRef,
    ],
  )

  const cancel = React.useCallback(() => {
    if (!monitorActiveRef.current && closeTimerRef.current === null) return
    stopMonitor()
    clearClose()
    paramsRef.current.onSettled?.('cancel')
    log('cancel')
  }, [clearClose, log, stopMonitor])

  React.useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (isMouseLikePointerType(event.pointerType))
        lastPointerRef.current = { x: event.clientX, y: event.clientY }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])
  React.useEffect(() => {
    if (!showSafeTriangleArea.enabled) resetDebug()
  }, [showSafeTriangleArea.enabled, resetDebug])
  React.useEffect(
    () => () => {
      stopMonitor()
      clearClose()
      clearMissTimer()
    },
    [clearClose, clearMissTimer, stopMonitor],
  )

  const debug = React.useMemo<AimMonitorDebug>(
    () => ({
      get state() {
        return debugStateRef.current
      },
      get snapshot() {
        return debugSnapshotRef.current
      },
      markHover: () => {
        if (!showSafeTriangleArea.enabled) return
        clearMissTimer()
        setDebug('hover', null)
      },
      reset: resetDebug,
    }),
    [clearMissTimer, resetDebug, setDebug, showSafeTriangleArea.enabled],
  )
  return React.useMemo(
    () => ({
      pointerLeft,
      cancel,
      isActive: () =>
        monitorActiveRef.current || closeTimerRef.current !== null,
      debug,
    }),
    [cancel, debug, pointerLeft],
  )
}
