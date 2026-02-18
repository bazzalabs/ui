'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import type { PopupMenuSafeTriangleAreaDebugSettings } from '../../contexts/popup-menu-debug-context.js'
import { resolveAnchorSide } from '../../utils/aim-guard.js'
import { useMousePosition } from '../../utils/use-mouse-position.js'

export type PopupMenuSubmenuSafeTriangleTone = 'hover' | 'activated' | 'missed'

export interface PopupMenuSubmenuSafeTriangleAreaProps {
  config: PopupMenuSafeTriangleAreaDebugSettings
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
    config,
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
  const yPct = Math.max(0, Math.min(100, ((mouseY - y) / height) * 100))

  const triangleWidth =
    anchor === 'left'
      ? Math.max(x - mouseX, 10) + inset
      : Math.max(mouseX - (x + width), 10) + inset

  const overlayOpacity = Math.max(0, Math.min(1, config.overlayOpacity))
  const triangleFillOpacity = Math.max(
    0,
    Math.min(1, config.triangleFillOpacity),
  )

  const borderStrokeWidth = config.showStroke
    ? Math.max(0, config.strokeWidth)
    : 0
  const requestedDotRadius = config.showDots ? Math.max(0, config.dotRadius) : 0
  const maxAllowedInset = Math.max(1, Math.min(triangleWidth, height) / 2)

  // Keep stroke + dots inside the SVG viewport to avoid clipping.
  const borderInset = Math.min(
    Math.max(requestedDotRadius, borderStrokeWidth / 2) + 0.5,
    maxAllowedInset,
  )

  const cornerDotRadius = config.showDots
    ? Math.max(
        0,
        Math.min(requestedDotRadius, borderInset - borderStrokeWidth / 2 - 0.5),
      )
    : 0

  const apexY = Math.max(
    borderInset,
    Math.min(height - borderInset, (yPct / 100) * height),
  )

  const left = anchor === 'left' ? x - triangleWidth : x + width

  let toneColor = config.idleColor
  if (tone === 'activated') {
    toneColor = config.successColor
  } else if (tone === 'missed') {
    toneColor = config.missColor
  }

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
        opacity: overlayOpacity,
      }}
    >
      <polygon
        points={polygonPoints}
        fill={toneColor}
        fillOpacity={triangleFillOpacity}
        stroke={config.showStroke ? toneColor : 'none'}
        strokeWidth={borderStrokeWidth}
        strokeDasharray={config.showStroke ? config.strokeDasharray : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {config.showDots
        ? trianglePoints.map(([cx, cy]) => (
            <circle
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r={cornerDotRadius}
              fill={toneColor}
            />
          ))
        : null}
    </svg>
  )

  return createPortal(triangle, document.body)
}
