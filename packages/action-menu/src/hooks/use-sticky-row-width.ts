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
      // Prefer a dedicated child with width:max-content to reflect natural width.
      const probe = rowEl.querySelector<HTMLElement>('.rowContent') ?? rowEl
      const prevWidth = probe.style.width
      probe.style.width = 'max-content'

      // scrollWidth is robust for overflow cases; getBoundingClientRect for precision
      const w = Math.max(
        probe.scrollWidth,
        probe.getBoundingClientRect().width,
        probe.offsetWidth,
      )
      probe.style.width = prevWidth
      updateIfLarger(w)
    },
    [updateIfLarger],
  )

  return { measureRow }
}
