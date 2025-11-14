import * as React from 'react'

/** Keep the last N mouse positions without causing re-renders. */
export function useMouseTrail(n = 2) {
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
