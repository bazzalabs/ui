'use client'

import * as React from 'react'
import type { SuggestionMenuAnchor } from '../handle.js'

/** The anchor the popup is positioned against. */
export interface SuggestionMenuVirtualAnchor {
  getBoundingClientRect(): DOMRect
  /** The host input, so scrolling its containers repositions the popup. */
  contextElement: Element | undefined
}

function sameRect(a: DOMRect, b: DOMRect) {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  )
}

/**
 * Wraps the anchor function in a virtual anchor for the positioner.
 *
 * Base UI repositions (a flip/shift/size pass) whenever it gets a new anchor
 * object, so a new one is made only when the measured rect differs from the
 * last one. The anchor is measured once per change of `measureKey` (each
 * `update()`, prop change or opening), the anchor function or the host.
 * `getBoundingClientRect()` always calls the latest function, so scrolling
 * re-measures and the popup follows. When the function returns `null`, the
 * last rect is kept.
 */
export function useVirtualAnchor(
  anchor: SuggestionMenuAnchor | null | undefined,
  host: Element | null,
  measureKey: unknown,
): { virtualAnchor: SuggestionMenuVirtualAnchor | undefined; ready: boolean } {
  const anchorRef = React.useRef(anchor)
  anchorRef.current = anchor
  const lastRectRef = React.useRef<DOMRect | null>(null)
  // Whether a rect was measured since the anchor was last passed in (i.e.
  // during this opening); the kept object may still hold the last one's.
  const readyRef = React.useRef(false)
  if (!anchor) readyRef.current = false
  const cacheRef = React.useRef<{
    anchor: SuggestionMenuAnchor | null | undefined
    host: Element | null
    measureKey: unknown
    value: SuggestionMenuVirtualAnchor | undefined
  } | null>(null)

  const cache = cacheRef.current
  if (
    cache &&
    cache.anchor === anchor &&
    cache.host === host &&
    cache.measureKey === measureKey
  ) {
    return { virtualAnchor: cache.value, ready: readyRef.current }
  }

  let value = cache?.value
  const rect = anchor?.() ?? null
  if (rect) readyRef.current = true
  const hostChanged =
    value !== undefined && value.contextElement !== (host ?? undefined)
  if (rect && (!lastRectRef.current || !sameRect(rect, lastRectRef.current))) {
    lastRectRef.current = rect
    value = undefined
  }
  if (anchor && (value === undefined || hostChanged) && lastRectRef.current) {
    value = {
      getBoundingClientRect: () => {
        const latest = anchorRef.current?.() ?? null
        if (latest) lastRectRef.current = latest
        return lastRectRef.current ?? new DOMRect()
      },
      contextElement: host ?? undefined,
    }
  }
  cacheRef.current = { anchor, host, measureKey, value }
  return { virtualAnchor: value, ready: readyRef.current }
}
