'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { resolveAnchorSide } from '../../utils/aim-guard.js'
import { useMousePosition } from '../../utils/use-mouse-position.js'

export type PopupMenuSubmenuSafeTriangleTone = 'hover' | 'activated'

const TONE_TO_BG_COLOR: Record<PopupMenuSubmenuSafeTriangleTone, string> = {
  hover: 'rgba(0, 136, 255, 0.18)',
  activated: 'rgba(0, 170, 102, 0.2)',
}

const TONE_TO_BORDER_COLOR: Record<PopupMenuSubmenuSafeTriangleTone, string> = {
  hover: 'rgba(0, 136, 255, 0.9)',
  activated: 'rgba(0, 170, 102, 0.9)',
}

export interface PopupMenuSubmenuSafeTriangleAreaProps {
  contentRef: React.RefObject<HTMLElement | null>
  triggerRef: React.RefObject<HTMLElement | null>
  tone: PopupMenuSubmenuSafeTriangleTone
  contentRectOverride?: DOMRect | null
  triggerRectOverride?: DOMRect | null
  mousePointOverride?: [number, number] | null
}

/**
 * Visual-only debug triangle showing the submenu safe area.
 */
export function PopupMenuSubmenuSafeTriangleArea(
  props: PopupMenuSubmenuSafeTriangleAreaProps,
) {
  const {
    contentRef,
    triggerRef,
    tone,
    contentRectOverride,
    triggerRectOverride,
    mousePointOverride,
  } = props
  const [liveMouseX, liveMouseY] = useMousePosition()

  const isCoarse = React.useMemo(
    () =>
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(pointer: coarse)').matches
        : false,
    [],
  )

  const contentElement = contentRef.current
  const rect = contentRectOverride ?? contentElement?.getBoundingClientRect()
  if (!rect || isCoarse || typeof document === 'undefined' || !document.body) {
    return null
  }

  const triggerRect =
    triggerRectOverride ??
    (triggerRef.current ? triggerRef.current.getBoundingClientRect() : null)

  const mouseX = mousePointOverride?.[0] ?? liveMouseX
  const mouseY = mousePointOverride?.[1] ?? liveMouseY

  const x = rect.left
  const y = rect.top
  const width = rect.width
  const height = rect.height

  if (!width || !height) {
    return null
  }

  const anchor = resolveAnchorSide(rect, triggerRect, mouseX)

  if (anchor === 'left' && mouseX >= x) {
    return null
  }

  if (anchor === 'right' && mouseX <= x + width) {
    return null
  }

  const inset = 2
  const borderStrokeWidth = 1.5
  const cornerDotRadius = 4
  // Keep border + corner dots fully inside the SVG viewport to avoid clipping.
  const borderInset = cornerDotRadius + borderStrokeWidth / 2 + 0.5
  const yPct = Math.max(0, Math.min(100, ((mouseY - y) / height) * 100))
  const apexY = Math.max(
    borderInset,
    Math.min(height - borderInset, (yPct / 100) * height),
  )

  const triangleWidth =
    anchor === 'left'
      ? Math.max(x - mouseX, 10) + inset
      : Math.max(mouseX - (x + width), 10) + inset

  const left = anchor === 'left' ? x - triangleWidth : x + width

  const trianglePoints: [[number, number], [number, number], [number, number]] =
    anchor === 'left'
      ? [
          [triangleWidth - borderInset, borderInset],
          [borderInset, apexY],
          [triangleWidth - borderInset, height - borderInset],
        ]
      : [
          [borderInset, borderInset],
          [borderInset, height - borderInset],
          [triangleWidth - borderInset, apexY],
        ]

  const polygonPoints = trianglePoints
    .map(([px, py]) => `${px},${py}`)
    .join(' ')

  const borderColor = TONE_TO_BORDER_COLOR[tone]

  const triangle = (
    <svg
      data-bazzaui-submenu-safe-triangle-area=""
      data-safe-triangle-tone={tone}
      aria-hidden
      viewBox={`0 0 ${triangleWidth} ${height}`}
      style={{
        position: 'fixed',
        top: y,
        left,
        width: triangleWidth,
        height,
        pointerEvents: 'none',
        zIndex: Number.MAX_SAFE_INTEGER,
        transform: 'translateZ(0)',
      }}
    >
      <polygon
        points={polygonPoints}
        fill={TONE_TO_BG_COLOR[tone]}
        stroke={borderColor}
        strokeWidth={borderStrokeWidth}
        strokeDasharray="6 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {trianglePoints.map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={cornerDotRadius}
          fill={borderColor}
        />
      ))}
    </svg>
  )

  return createPortal(triangle, document.body)
}
