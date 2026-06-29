import { clamp } from './clamp.js'

/**
 * Pixel tolerance used when comparing scroll offsets against their edges.
 * Sub-pixel rounding (zoom, fractional DPR) can leave a scroller a fraction
 * of a pixel away from a true edge; treat anything within this distance as
 * "at the edge".
 */
export const SCROLL_EDGE_TOLERANCE_PX = 1

/**
 * The maximum scroll offset for a scroller, i.e. how far it can scroll on a
 * given axis. Never negative (content shorter than the viewport yields `0`).
 */
export function getMaxScrollOffset(
  scrollSize: number,
  clientSize: number,
): number {
  return Math.max(0, scrollSize - clientSize)
}

/**
 * Normalize a scroll offset into `[0, max]`, snapping to an edge when within
 * {@link SCROLL_EDGE_TOLERANCE_PX} of it. When both edges are within tolerance
 * (a barely-scrollable scroller), snaps to whichever edge is closer.
 */
export function normalizeScrollOffset(value: number, max: number): number {
  if (max <= 0) {
    return 0
  }

  const clamped = clamp(value, 0, max)
  const startDistance = clamped
  const endDistance = max - clamped
  const withinStartTolerance = startDistance <= SCROLL_EDGE_TOLERANCE_PX
  const withinEndTolerance = endDistance <= SCROLL_EDGE_TOLERANCE_PX

  if (withinStartTolerance && withinEndTolerance) {
    return startDistance <= endDistance ? 0 : max
  }

  if (withinStartTolerance) {
    return 0
  }

  if (withinEndTolerance) {
    return max
  }

  return clamped
}
