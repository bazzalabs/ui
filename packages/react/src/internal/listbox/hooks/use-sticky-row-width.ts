'use client'

import * as React from 'react'

function px(n: number) {
  return `${Math.ceil(n)}px`
}

interface MeasurementEntry {
  element: HTMLElement
  id: string
}

export interface UseStickyRowWidthOptions {
  /**
   * Ref to the list container element.
   * Used to measure row widths and as a fallback target for the CSS variable.
   */
  listRef: React.RefObject<HTMLElement | null>
  /**
   * Optional ref to the element where `--row-width` CSS variable should be applied.
   * If not provided, uses the listRef element.
   * Useful for applying the variable to a parent Popup element.
   */
  targetRef?: React.RefObject<HTMLElement | null>
  /**
   * Optional maximum width cap in pixels.
   * The measured width will never exceed this value.
   */
  maxWidth?: number
  /**
   * Whether measurement is enabled.
   * @default true
   */
  enabled?: boolean
}

export interface UseStickyRowWidthReturn {
  /**
   * Queue a row element for measurement.
   * The element's natural width will be measured and tracked.
   * Call this when a row mounts or becomes visible.
   */
  queueMeasurement: (element: HTMLElement, id: string) => void
  /**
   * Reset all measurements.
   * Call this when the menu closes to start fresh on next open.
   */
  resetMeasurements: () => void
}

/**
 * Hook that measures row widths and maintains a sticky maximum width.
 *
 * This is useful for virtualized lists where the popup width should adapt
 * to the content but never shrink as the user scrolls through items.
 *
 * The hook:
 * 1. Measures each row's natural width (using `max-content`)
 * 2. Tracks the maximum width seen across all rows
 * 3. Applies `--row-width` CSS variable to the list element
 * 4. Only grows the width, never shrinks (until reset)
 *
 * @example
 * ```tsx
 * const { queueMeasurement, resetMeasurements } = useStickyRowWidth({
 *   listRef: myListRef,
 *   maxWidth: 500,
 * })
 *
 * // Queue items for measurement
 * useLayoutEffect(() => {
 *   if (itemRef.current) {
 *     queueMeasurement(itemRef.current, itemId)
 *   }
 * }, [itemId])
 *
 * // Reset on menu close
 * useEffect(() => {
 *   if (!isOpen) {
 *     resetMeasurements()
 *   }
 * }, [isOpen])
 * ```
 */
export function useStickyRowWidth(
  options: UseStickyRowWidthOptions,
): UseStickyRowWidthReturn {
  const { listRef, targetRef, maxWidth, enabled = true } = options

  // The element where CSS variable is applied (targetRef if provided, else listRef)
  const getTargetElement = React.useCallback(() => {
    return targetRef?.current ?? listRef.current
  }, [targetRef, listRef])

  // Track the maximum width seen so far
  const maxSeenRef = React.useRef(0)

  // RAF scheduler state
  const readQueue = React.useRef<MeasurementEntry[]>([])
  const writeQueue = React.useRef<Array<() => void>>([])
  const scheduled = React.useRef(false)
  const measuredIds = React.useRef<Set<string>>(new Set())

  /**
   * Apply the `--row-width` CSS variable to the target element.
   */
  const applyVar = React.useCallback(
    (width: number) => {
      const el = getTargetElement()
      if (!el) return

      // Apply hard cap if specified
      const capped = maxWidth !== undefined ? Math.min(width, maxWidth) : width

      el.style.setProperty('--row-width', px(capped))
    },
    [getTargetElement, maxWidth],
  )

  /**
   * RAF scheduler: batch reads, then batch writes.
   * This avoids layout thrashing by separating measurement from application.
   */
  const schedule = React.useCallback(() => {
    if (scheduled.current) return
    scheduled.current = true

    requestAnimationFrame(() => {
      // === READ PHASE: Measure all queued rows at once ===
      const measurements = readQueue.current
      let maxWidth = maxSeenRef.current
      let foundNewMax = false

      if (measurements.length > 0) {
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
        writeQueue.current.push(() => applyVar(maxWidth))
      }

      for (const write of writeQueue.current) {
        write()
      }
      writeQueue.current = []
      scheduled.current = false
    })
  }, [applyVar])

  /**
   * Queue a row element for measurement.
   */
  const queueMeasurement = React.useCallback(
    (element: HTMLElement, id: string) => {
      if (!enabled) return

      // Skip if already measured
      if (measuredIds.current.has(id)) return

      // Add to read queue
      readQueue.current.push({ element, id })
      schedule()
    },
    [enabled, schedule],
  )

  /**
   * Reset all measurements.
   * This clears the tracked IDs and resets the max width.
   */
  const resetMeasurements = React.useCallback(() => {
    measuredIds.current.clear()
    maxSeenRef.current = 0

    // Clear the CSS variable
    const el = getTargetElement()
    if (el) {
      el.style.removeProperty('--row-width')
    }
  }, [getTargetElement])

  // Re-apply the CSS variable when the target element resizes (e.g., viewport changes)
  // Use useEffect (not useLayoutEffect) to avoid conflicts with React's commit phase
  React.useEffect(() => {
    if (!enabled) return

    const container = getTargetElement()
    if (!container) return

    // ResizeObserver may not be available in some environments (SSR, older browsers, tests)
    if (typeof ResizeObserver === 'undefined') return

    let rafId: number | null = null

    const ro = new ResizeObserver(() => {
      // Defer to next frame to avoid flushSync conflicts during React's commit phase
      // This prevents errors when virtualizers or other components use flushSync
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      rafId = requestAnimationFrame(() => {
        rafId = null
        if (maxSeenRef.current > 0) {
          applyVar(maxSeenRef.current)
        }
      })
    })
    ro.observe(container)

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      ro.disconnect()
    }
  }, [getTargetElement, enabled, applyVar])

  return { queueMeasurement, resetMeasurements }
}
