import type { AnchorSide } from '../types.js'

export function resolveAnchorSide(
  rect: DOMRect,
  tRect: DOMRect | null,
  mx: number,
): AnchorSide {
  if (tRect) {
    const tx = (tRect.left + tRect.right) / 2
    const dL = Math.abs(tx - rect.left)
    const dR = Math.abs(tx - rect.right)
    return dL <= dR ? 'left' : 'right'
  }
  return mx < rect.left ? 'left' : 'right'
}

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
    const edgeX = anchor === 'right' ? rect.left : rect.right
    const edgeCy = (rect.top + rect.bottom) / 2
    dx = edgeX - tx
    dy = edgeCy - ty
  }
  return { dx, dy }
}

export function willHitSubmenu(
  exitX: number,
  exitY: number,
  heading: { dx: number; dy: number },
  rect: DOMRect,
  anchor: AnchorSide,
  triggerRect: DOMRect | null,
): boolean {
  const { dx, dy } = heading
  if (Math.abs(dx) < 0.01) return false
  if (anchor === 'left' && dx <= 0) return false
  if (anchor === 'right' && dx >= 0) return false
  const edgeX = anchor === 'left' ? rect.left : rect.right
  const t = (edgeX - exitX) / dx
  if (t <= 0) return false
  const yAtEdge = exitY + t * dy
  const baseBand = triggerRect ? triggerRect.height * 0.75 : 28
  const extra = Math.max(12, Math.min(36, baseBand))
  const top = rect.top - extra * 0.25
  const bottom = rect.bottom + extra * 0.25
  return yAtEdge >= top && yAtEdge <= bottom
}
