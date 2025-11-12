import * as React from 'react'

function px(n: number) {
  return `${Math.ceil(n)}px`
}

type MeasurementEntry = {
  element: HTMLElement
  id: string
}

export function useStickyRowWidth(opts: {
  containerRef: React.RefObject<HTMLElement | null> // the .listViewport element
  designMaxPx?: number // optional hard cap, e.g. 560
}) {
  const { containerRef, designMaxPx } = opts
  const maxSeenRef = React.useRef(0)

  // RAF scheduler state
  const readQueue = React.useRef<MeasurementEntry[]>([])
  const writeQueue = React.useRef<Array<() => void>>([])
  const scheduled = React.useRef(false)
  const measuredIds = React.useRef<Set<string>>(new Set())

  // Read Radix available width (cached per schedule cycle)
  const radixCapCache = React.useRef<number | null>(null)

  const readRadixMax = React.useCallback(() => {
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
    (n: number, radixCap: number) => {
      const el = containerRef.current
      if (!el) return
      const hardCap = Number.isFinite(designMaxPx ?? Number.NaN)
        ? designMaxPx!
        : Number.POSITIVE_INFINITY
      const capped = Math.min(n, radixCap, hardCap)
      el.style.setProperty('--row-width', px(capped))

      const surface = el.closest<HTMLElement>(
        '[data-slot="action-menu-content"]',
      )
      if (!surface) return
      surface.style.setProperty('--row-width', px(capped))
    },
    [containerRef, designMaxPx],
  )

  // RAF scheduler: batch reads, then batch writes
  const schedule = React.useCallback(() => {
    if (scheduled.current) return
    scheduled.current = true

    requestAnimationFrame(() => {
      // === READ PHASE: Measure all queued rows at once ===
      const measurements = readQueue.current
      let maxWidth = maxSeenRef.current
      let foundNewMax = false

      if (measurements.length > 0) {
        // Read radix cap ONCE for this batch
        radixCapCache.current = readRadixMax()

        for (const { element, id } of measurements) {
          // Skip if already measured
          if (measuredIds.current.has(id)) continue

          // Read natural width without interleaving writes
          const prevWidth = element.style.width
          element.style.width = 'max-content'

          const w = Math.max(element.scrollWidth, element.offsetWidth) + 1

          element.style.width = prevWidth

          if (w > maxWidth) {
            maxWidth = w
            foundNewMax = true
          }

          measuredIds.current.add(id)
        }

        readQueue.current = []
      }

      // === WRITE PHASE: Apply styles after all reads complete ===
      if (foundNewMax) {
        maxSeenRef.current = maxWidth
        writeQueue.current.push(() =>
          applyVar(maxWidth, radixCapCache.current!),
        )
      }

      for (const write of writeQueue.current) {
        write()
      }
      writeQueue.current = []
      radixCapCache.current = null
      scheduled.current = false
    })
  }, [readRadixMax, applyVar])

  // Re-apply cap when the container/popover resizes (viewport changes)
  React.useLayoutEffect(() => {
    const dialog = containerRef.current?.querySelector(
      '[data-slot="action-menu-list"]',
    )
    if (!dialog) return
    const ro = new ResizeObserver(() => {
      if (maxSeenRef.current > 0) {
        // Read radix cap and apply immediately (not in batch, as this is a resize event)
        const radixCap = readRadixMax()
        applyVar(maxSeenRef.current, radixCap)
      }
    })
    ro.observe(dialog)
    return () => ro.disconnect()
  }, [containerRef, applyVar, readRadixMax])

  // Public API: queue a row for measurement
  const queueMeasurement = React.useCallback(
    (element: HTMLElement, id: string) => {
      // Skip if already measured
      if (measuredIds.current.has(id)) return

      // Add to read queue
      readQueue.current.push({ element, id })
      schedule()
    },
    [schedule],
  )

  // Reset measured IDs when the menu reopens or query changes
  const resetMeasurements = React.useCallback(() => {
    measuredIds.current.clear()
    maxSeenRef.current = 0
  }, [])

  return { queueMeasurement, resetMeasurements }
}
