export type AnchorSide = 'left' | 'right' | 'top' | 'bottom'

function resolveSideFromPoint(rect: DOMRect, x: number, y: number): AnchorSide {
  const outsideCandidates: Array<{ side: AnchorSide; gap: number }> = []

  const leftGap = rect.left - x
  if (leftGap > 0) {
    outsideCandidates.push({ side: 'left', gap: leftGap })
  }

  const rightGap = x - rect.right
  if (rightGap > 0) {
    outsideCandidates.push({ side: 'right', gap: rightGap })
  }

  const topGap = rect.top - y
  if (topGap > 0) {
    outsideCandidates.push({ side: 'top', gap: topGap })
  }

  const bottomGap = y - rect.bottom
  if (bottomGap > 0) {
    outsideCandidates.push({ side: 'bottom', gap: bottomGap })
  }

  if (outsideCandidates.length > 0) {
    outsideCandidates.sort((a, b) => b.gap - a.gap)
    return outsideCandidates[0]!.side
  }

  const insideDistances: Array<{ side: AnchorSide; value: number }> = [
    { side: 'left', value: Math.abs(x - rect.left) },
    { side: 'right', value: Math.abs(x - rect.right) },
    { side: 'top', value: Math.abs(y - rect.top) },
    { side: 'bottom', value: Math.abs(y - rect.bottom) },
  ]

  insideDistances.sort((a, b) => a.value - b.value)
  return insideDistances[0]!.side
}

/**
 * Determines which side of the submenu the trigger is anchored to.
 * Used to know which direction the user should be moving toward.
 */
export function resolveAnchorSide(
  rect: DOMRect,
  tRect: DOMRect | null,
  mx: number,
  my?: number,
): AnchorSide {
  if (tRect) {
    const tx = (tRect.left + tRect.right) / 2
    const ty = (tRect.top + tRect.bottom) / 2

    return resolveSideFromPoint(rect, tx, ty)
  }

  if (my === undefined) {
    if (mx < rect.left) {
      return 'left'
    }
    if (mx > rect.right) {
      return 'right'
    }

    const centerX = (rect.left + rect.right) / 2
    return mx <= centerX ? 'left' : 'right'
  }

  return resolveSideFromPoint(rect, mx, my)
}

/**
 * Calculates a smoothed heading vector from the mouse trail.
 * If movement is too slow, infers direction toward the submenu center.
 */
export function getSmoothedHeading(
  trail: [number, number][],
  exitX: number,
  exitY: number,
  anchor: AnchorSide,
  tRect: DOMRect | null,
  rect: DOMRect,
): { dx: number; dy: number } {
  let dx = 0
  let dy = 0
  const n = Math.min(Math.max(trail.length - 1, 0), 4)
  for (let i = trail.length - n - 1; i < trail.length - 1; i++) {
    if (i < 0) continue
    const [x1, y1] = trail[i]!
    const [x2, y2] = trail[i + 1]!
    dx += x2 - x1
    dy += y2 - y1
  }
  const mag = Math.hypot(dx, dy)
  if (mag < 0.5) {
    const tx = tRect ? (tRect.left + tRect.right) / 2 : exitX
    const ty = tRect ? (tRect.top + tRect.bottom) / 2 : exitY

    if (anchor === 'left' || anchor === 'right') {
      const edgeX = anchor === 'right' ? rect.right : rect.left
      const edgeCy = (rect.top + rect.bottom) / 2
      dx = edgeX - tx
      dy = edgeCy - ty
    } else {
      const edgeY = anchor === 'top' ? rect.top : rect.bottom
      const edgeCx = (rect.left + rect.right) / 2
      dx = edgeCx - tx
      dy = edgeY - ty
    }
  }
  return { dx, dy }
}

/**
 * Tests if the user's trajectory will intersect the submenu's safe zone.
 * Returns true if the user is aiming toward the submenu.
 */
export function willHitSubmenu(
  exitX: number,
  exitY: number,
  heading: { dx: number; dy: number },
  rect: DOMRect,
  anchor: AnchorSide,
  triggerRect: DOMRect | null,
): boolean {
  const { dx, dy } = heading

  const isHorizontal = anchor === 'left' || anchor === 'right'
  const primary = isHorizontal ? dx : dy
  if (Math.abs(primary) < 0.01) {
    return false
  }

  if (
    (anchor === 'left' && dx <= 0) ||
    (anchor === 'right' && dx >= 0) ||
    (anchor === 'top' && dy <= 0) ||
    (anchor === 'bottom' && dy >= 0)
  ) {
    return false
  }

  const edge =
    anchor === 'left'
      ? rect.left
      : anchor === 'right'
        ? rect.right
        : anchor === 'top'
          ? rect.top
          : rect.bottom

  const t = (edge - (isHorizontal ? exitX : exitY)) / primary
  if (t <= 0) return false

  const projected = isHorizontal ? exitY + t * dy : exitX + t * dx

  const triggerCrossSize = triggerRect
    ? isHorizontal
      ? triggerRect.height
      : triggerRect.width
    : null
  const baseBand = triggerCrossSize ? triggerCrossSize * 0.75 : 28
  const extra = Math.max(12, Math.min(36, baseBand))

  const min = (isHorizontal ? rect.top : rect.left) - extra * 0.25
  const max = (isHorizontal ? rect.bottom : rect.right) + extra * 0.25

  return projected >= min && projected <= max
}
