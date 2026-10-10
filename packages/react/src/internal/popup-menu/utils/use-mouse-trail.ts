import * as React from 'react'

type MousePoint = [number, number]

/** Why a trail is being recorded; recording stops once no reason holds it. */
export type MouseTrailHoldReason = 'hover' | 'monitor'

interface MouseTrailSubscriber {
  trailRef: React.MutableRefObject<MousePoint[]>
  limit: number
}

const mouseTrailSubscribers = new Set<MouseTrailSubscriber>()

let removeMouseTrailListener: (() => void) | null = null

function ensureMouseTrailListener() {
  if (removeMouseTrailListener !== null || typeof window === 'undefined') {
    return
  }

  const onMove = (event: PointerEvent) => {
    for (const subscriber of mouseTrailSubscribers) {
      const trail = subscriber.trailRef.current
      trail.push([event.clientX, event.clientY])
      if (trail.length > subscriber.limit) {
        trail.shift()
      }
    }
  }

  window.addEventListener('pointermove', onMove, { passive: true })

  removeMouseTrailListener = () => {
    window.removeEventListener('pointermove', onMove)
    removeMouseTrailListener = null
  }
}

function cleanupMouseTrailListenerIfIdle() {
  if (mouseTrailSubscribers.size === 0) {
    removeMouseTrailListener?.()
  }
}

export interface MouseTrail {
  /** The last N pointer positions, oldest first. Empty while not tracking. */
  trailRef: React.MutableRefObject<MousePoint[]>
  /**
   * Keep recording for `reason`. The first hold starts recording with an
   * empty trail. Holding a reason that is already held is a no-op.
   */
  hold: (reason: MouseTrailHoldReason) => void
  /** Drop the hold for `reason`. Recording stops when no hold remains. */
  release: (reason: MouseTrailHoldReason) => void
}

/**
 * Keeps track of the last N mouse positions without causing re-renders.
 * Used for calculating mouse trajectory in aim guard.
 *
 * Positions are only recorded while at least one hold is active, so no
 * global `pointermove` listener exists while nothing needs the trail.
 */
export function useMouseTrail(n = 4): MouseTrail {
  const trailRef = React.useRef<MousePoint[]>([])
  const holdsRef = React.useRef<Set<MouseTrailHoldReason>>(new Set())
  const subscriberRef = React.useRef<MouseTrailSubscriber | null>(null)

  const stop = React.useCallback(() => {
    const subscriber = subscriberRef.current
    if (subscriber === null) return

    subscriberRef.current = null
    mouseTrailSubscribers.delete(subscriber)
    trailRef.current = []
    cleanupMouseTrailListenerIfIdle()
  }, [])

  const hold = React.useCallback(
    (reason: MouseTrailHoldReason) => {
      holdsRef.current.add(reason)
      if (subscriberRef.current !== null) return

      const subscriber: MouseTrailSubscriber = {
        trailRef,
        limit: n,
      }

      subscriberRef.current = subscriber
      trailRef.current = []
      mouseTrailSubscribers.add(subscriber)
      ensureMouseTrailListener()
    },
    [n],
  )

  const release = React.useCallback(
    (reason: MouseTrailHoldReason) => {
      holdsRef.current.delete(reason)
      if (holdsRef.current.size === 0) {
        stop()
      }
    },
    [stop],
  )

  // Stop recording on unmount
  React.useEffect(
    () => () => {
      holdsRef.current.clear()
      stop()
    },
    [stop],
  )

  return React.useMemo(() => ({ trailRef, hold, release }), [hold, release])
}
