import * as React from 'react'

function px(n: number) {
  return `${Math.ceil(n)}px`
}

export function useStickyRowWidth(opts: {
  containerRef: React.RefObject<HTMLElement | null> // the .listViewport element
  designMaxPx?: number // optional hard cap, e.g. 560
}) {
  const { containerRef, designMaxPx } = opts
  const maxSeenRef = React.useRef(0)
  const frame = React.useRef<number | null>(null)

  // Read Base UI available width (Base UI sets --available-width CSS variable)
  const readBaseUIMax = React.useCallback(() => {
    const el = containerRef.current
    if (!el) return Number.POSITIVE_INFINITY
    const cs = getComputedStyle(
      (el.closest('[role="dialog"]') as Element) ?? el,
    )
    const raw = cs.getPropertyValue('--available-width')?.trim()
    const v = raw?.endsWith('px') ? Number.parseFloat(raw) : Number.NaN
    return Number.isFinite(v) ? v : Number.POSITIVE_INFINITY
  }, [containerRef])

  const applyVar = React.useCallback(
    (n: number) => {
      const el = containerRef.current
      if (!el) return
      const baseUICap = readBaseUIMax()
      const hardCap = Number.isFinite(designMaxPx ?? Number.NaN)
        ? designMaxPx!
        : Number.POSITIVE_INFINITY
      const capped = Math.min(n, baseUICap, hardCap)
      el.style.setProperty('--row-width', px(capped))

      const surface = el.closest<HTMLElement>(
        '[data-slot="action-menu-content"]',
      )
      if (!surface) return
      console.log('--row-width:', px(capped))
      surface.style.setProperty('--row-width', px(capped))
    },
    [containerRef, designMaxPx, readBaseUIMax],
  )

  const updateIfLarger = React.useCallback(
    (naturalWidth: number) => {
      if (naturalWidth <= maxSeenRef.current) return
      maxSeenRef.current = naturalWidth
      // batch to next frame to avoid thrash while scrolling
      if (frame.current != null) cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => applyVar(maxSeenRef.current))
    },
    [applyVar],
  )

  // Re-apply cap when the container/popover resizes (viewport changes)
  React.useLayoutEffect(() => {
    const dialog =
      containerRef.current?.closest('[role="dialog"]') ?? containerRef.current
    if (!dialog) return
    const ro = new ResizeObserver(() => {
      if (maxSeenRef.current > 0) applyVar(maxSeenRef.current)
    })
    ro.observe(dialog)
    return () => ro.disconnect()
  }, [containerRef, applyVar])

  // Public API: call this for each mounted row to measure its *natural* width.
  const measureRow = React.useCallback(
    (rowEl: HTMLElement | null) => {
      if (!rowEl) return

      // Find the content element - it constrains the row width via --row-width
      const content = rowEl.closest<HTMLElement>(
        '[data-slot="action-menu-content"]',
      )

      // Temporarily remove --row-width constraint to allow true max-content measurement
      const prevRowWidth = content?.style.getPropertyValue('--row-width')
      const prevContentWidth = content?.style.width
      // if (content) {
      //   content.style.removeProperty('--row-width')
      //   content.style.width = '100%'
      // }

      // Set row to max-content
      const probe = rowEl
      const prevWidth = probe.style.width
      probe.style.width = 'max-content'

      // Force layout recalculation
      void probe.offsetHeight

      // Use offsetWidth and scrollWidth - both return pre-transform dimensions
      // Do NOT use getBoundingClientRect() as it returns post-transform (scaled) dimensions
      const w = Math.max(probe.scrollWidth, probe.offsetWidth)

      // Restore original styles
      probe.style.width = prevWidth
      // if (content && prevRowWidth && prevContentWidth) {
      //   content.style.setProperty('--row-width', prevRowWidth)
      //   content.style.width = prevContentWidth
      // }

      updateIfLarger(w)
    },
    [updateIfLarger],
  )

  return { measureRow }
}
