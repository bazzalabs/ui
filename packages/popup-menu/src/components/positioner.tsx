import { Popover } from '@base-ui-components/react/popover'
import * as React from 'react'
import { useSubCtx } from '../contexts/submenu-context.js'
import type { PopupMenuPositionerProps } from '../types.js'

export interface PositionerProps extends Children {
  side?: PopupMenuPositionerProps['side']
  align?: PopupMenuPositionerProps['align']
  sideOffset?: number
  alignOffset?: number
}

type Children = {
  children: React.ReactNode
}

/**
 * Positioner wraps submenu content and handles positioning with "list" alignment support.
 */
export function Positioner({
  children,
  side,
  align,
  sideOffset = 8,
  alignOffset = 0,
}: PositionerProps) {
  const sub = useSubCtx()

  const isSub = !!sub
  const defaultSide = isSub ? 'right' : 'bottom'
  const resolvedSide = side ?? defaultSide
  const defaultAlign = isSub ? 'list' : 'start'
  const resolvedAlign = align ?? defaultAlign

  const [listTopOffset, setListTopOffset] = React.useState(0)

  const findContentEl = React.useCallback((): HTMLElement | null => {
    if (!sub) return null
    const byRef = sub.contentRef.current
    if (byRef) return byRef
    try {
      return document.querySelector<HTMLElement>(
        `[data-surface-id="${sub.childSurfaceId}"]`,
      )
    } catch {
      return null
    }
  }, [sub])

  const measure = React.useCallback(() => {
    // Only measure when align is 'list'
    if (resolvedAlign !== 'list') {
      setListTopOffset(0)
      return
    }

    // Only applies to submenus
    if (!isSub || !sub?.open) {
      setListTopOffset(0)
      return
    }

    // Only applies to horizontal positioning
    if (!(resolvedSide === 'right' || resolvedSide === 'left')) {
      setListTopOffset(0)
      return
    }

    const el = findContentEl()
    if (!el) return

    const contentRect = el.getBoundingClientRect()

    // Check for input element (if it exists, align to bottom of input)
    const inputEl = el.querySelector<HTMLElement>('[data-action-menu-input]')
    const hasVisibleInput = !!inputEl && inputEl.offsetParent !== null

    if (hasVisibleInput) {
      // Align to bottom of input
      const inputRect = inputEl.getBoundingClientRect()
      const computedOffset = -Math.round(inputRect.bottom - contentRect.top)
      setListTopOffset(computedOffset)
      return
    }

    // No input, check for list element
    const listEl = el.querySelector<HTMLElement>(
      '[data-slot="action-menu-list"]',
    )

    if (listEl) {
      // Align to top of list (inside padding)
      const listRect = listEl.getBoundingClientRect()
      const listStyles = getComputedStyle(listEl)
      const listPaddingTop = Number.parseFloat(listStyles.paddingTop)
      const computedOffset = -Math.round(
        listRect.top + listPaddingTop - contentRect.top,
      )
      setListTopOffset(computedOffset)
      return
    }

    // Fallback: no offset
    setListTopOffset(0)
  }, [resolvedAlign, isSub, sub?.open, resolvedSide, findContentEl, sub])

  React.useLayoutEffect(() => {
    if (!isSub || !sub?.open || resolvedAlign !== 'list') {
      return
    }

    // Measure immediately on mount
    measure()

    // Re-measure on animation frame (after render)
    const rafId = requestAnimationFrame(measure)

    return () => cancelAnimationFrame(rafId)
  }, [isSub, sub?.open, resolvedAlign, measure])

  // Calculate final align offset when using 'list' mode
  const finalAlignOffset = resolvedAlign === 'list' ? listTopOffset : alignOffset

  // Map 'list' to Base UI's 'start' for the actual positioning
  const baseUIAlign = resolvedAlign === 'list' ? 'start' : resolvedAlign

  return (
    <Popover.Positioner
      side={resolvedSide}
      align={baseUIAlign}
      sideOffset={sideOffset}
      alignOffset={finalAlignOffset}
      sticky
      positionMethod="fixed"
      collisionPadding={8}
    >
      {children}
    </Popover.Positioner>
  )
}
