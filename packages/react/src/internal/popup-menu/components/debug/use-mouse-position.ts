import * as React from 'react'

/**
 * Tracks the current mouse coordinates.
 * Used by debug overlays that follow pointer position.
 */
export function useMousePosition(): [number, number] {
  const [position, setPosition] = React.useState<[number, number]>([0, 0])

  React.useEffect(() => {
    const onMove = (event: PointerEvent) => {
      setPosition([event.clientX, event.clientY])
    }

    window.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return position
}
