import * as React from 'react'

type MousePoint = [number, number]

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

/**
 * Keeps track of the last N mouse positions without causing re-renders.
 * Used for calculating mouse trajectory in aim guard.
 */
export function useMouseTrail(n = 4) {
  const trailRef = React.useRef<MousePoint[]>([])

  React.useEffect(() => {
    const subscriber: MouseTrailSubscriber = {
      trailRef,
      limit: n,
    }

    mouseTrailSubscribers.add(subscriber)
    ensureMouseTrailListener()

    return () => {
      mouseTrailSubscribers.delete(subscriber)
      trailRef.current = []
      cleanupMouseTrailListenerIfIdle()
    }
  }, [n])

  return trailRef
}
