import * as React from 'react'

function px(n: number) {
  return `${Math.ceil(n)}px`
}

/**
 * Hook to track and expose surface dimensions as CSS variables.
 * Sets --menu-width and --menu-height on the observed element.
 */
export function useSurfaceDimensions(
  elementRef: React.RefObject<HTMLElement | null>,
) {
  React.useLayoutEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        element.style.setProperty('--menu-width', px(width))
        element.style.setProperty('--menu-height', px(height))
      }
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [elementRef])
}
