import * as React from 'react'

/**
 * Keeps track of the last N mouse positions without causing re-renders.
 * Used for calculating mouse trajectory in aim guard.
 */
export function useMouseTrail(n = 4) {
  const trailRef = React.useRef<[number, number][]>([])

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const a = trailRef.current
      a.push([e.clientX, e.clientY])
      if (a.length > n) a.shift()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [n])

  return trailRef
}
