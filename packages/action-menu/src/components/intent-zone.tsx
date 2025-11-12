import { Portal } from '@radix-ui/react-portal'
import * as React from 'react'
import { useMousePosition } from '../hooks/use-mouse-position.js'
import { resolveAnchorSide } from '../lib/aim-guard.js'
import { logPerformance } from '../lib/performance.js'

/** Visual-only debug polygon showing the aim-guard band. */
export function IntentZone({
  parentRef,
  triggerRef,
  visible = false,
}: {
  parentRef: React.RefObject<HTMLElement | null>
  triggerRef: React.RefObject<HTMLElement | null>
  visible?: boolean
}) {
  const [mx, my] = useMousePosition()
  const isCoarse = React.useMemo(
    () =>
      typeof window !== 'undefined'
        ? matchMedia('(pointer: coarse)').matches
        : false,
    [],
  )
  const content = parentRef.current
  const rect = content
    ? logPerformance('getBoundingClientRect', 'IntentZone.content', () =>
        content.getBoundingClientRect(),
      )
    : undefined
  if (!rect || isCoarse) return null
  const tRect = triggerRef?.current
    ? logPerformance('getBoundingClientRect', 'IntentZone.trigger', () =>
        triggerRef.current!.getBoundingClientRect(),
      )
    : null
  const x = rect.left
  const y = rect.top
  const w = rect.width
  const h = rect.height
  if (!w || !h) return null
  const anchor = resolveAnchorSide(rect, tRect, mx)
  if (anchor === 'left' && mx >= x) return null
  if (anchor === 'right' && mx <= x + w) return null
  const INSET = 2
  const pct = Math.max(0, Math.min(100, ((my - y) / h) * 100))
  const width =
    anchor === 'left'
      ? Math.max(x - mx, 10) + INSET
      : Math.max(mx - (x + w), 10) + INSET
  const left = anchor === 'left' ? x - width : x + w
  const clip =
    anchor === 'left'
      ? `polygon(100% 0%, 0% ${pct}%, 100% 100%)`
      : `polygon(0% 0%, 0% 100%, 100% ${pct}%)`
  const Polygon = (
    <div
      data-action-menu-intent-zone
      aria-hidden
      style={{
        position: 'fixed',
        top: y,
        left,
        width,
        height: h,
        pointerEvents: 'none',
        clipPath: clip,
        zIndex: Number.MAX_SAFE_INTEGER,
        background: visible ? 'rgba(0, 136, 255, 0.15)' : 'transparent',
        transform: 'translateZ(0)',
      }}
    />
  )
  return <Portal>{Polygon}</Portal>
}
