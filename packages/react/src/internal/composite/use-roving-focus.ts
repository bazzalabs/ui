'use client'

import * as React from 'react'

const CANDIDATE_SELECTOR =
  'button, a[href], input, select, textarea, [data-roving-item]'

export interface UseRovingFocusParams {
  /** Ref to the container whose focusable children are managed. */
  containerRef: React.RefObject<HTMLElement | null>
  /**
   * Which arrow keys move focus.
   * 'horizontal' → ArrowLeft/ArrowRight; 'vertical' → ArrowUp/ArrowDown;
   * 'both' → all four.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical' | 'both'
  /** Wrap from last to first and vice versa. @default false */
  loop?: boolean
  /** @default true */
  enabled?: boolean
}

export interface UseRovingFocusReturn {
  /** Attach to the container element. */
  onKeyDown: React.KeyboardEventHandler
  /** Attach to the container element (React onFocus bubbles like focusin). */
  onFocus: React.FocusEventHandler
}

/**
 * Returns the elements that should participate in roving-tabindex navigation.
 */
export function getRovingCandidates(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR),
  ).filter((element) => {
    return (
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-disabled') !== 'true' &&
      !element.hasAttribute('data-roving-skip') &&
      element.closest('[data-roving-skip]') === null
    )
  })
}

function normalizeTabStops(
  candidates: HTMLElement[],
  activeIndex: number,
): void {
  candidates.forEach((candidate, index) => {
    candidate.setAttribute('tabindex', index === activeIndex ? '0' : '-1')
  })
}

function ensureSingleTabStop(container: HTMLElement): void {
  const candidates = getRovingCandidates(container)

  if (candidates.length === 0) {
    return
  }

  const activeIndex = candidates.findIndex(
    (candidate) => candidate.getAttribute('tabindex') === '0',
  )

  normalizeTabStops(candidates, activeIndex === -1 ? 0 : activeIndex)
}

function getMoveDirection(
  key: string,
  orientation: NonNullable<UseRovingFocusParams['orientation']>,
): -1 | 1 | null {
  const handlesHorizontal =
    orientation === 'horizontal' || orientation === 'both'
  const handlesVertical = orientation === 'vertical' || orientation === 'both'

  if (handlesHorizontal) {
    if (key === 'ArrowRight') {
      return 1
    }
    if (key === 'ArrowLeft') {
      return -1
    }
  }

  if (handlesVertical) {
    if (key === 'ArrowDown') {
      return 1
    }
    if (key === 'ArrowUp') {
      return -1
    }
  }

  return null
}

/**
 * Manages roving-tabindex focus within a composite widget container.
 *
 * Exactly one candidate child is kept tabbable, arrow keys move that tab stop
 * and DOM focus, and focusing a candidate remembers it as the next tab entry
 * point when focus leaves and returns to the container.
 */
export function useRovingFocus(
  params: UseRovingFocusParams,
): UseRovingFocusReturn {
  const {
    containerRef,
    orientation = 'horizontal',
    loop = false,
    enabled = true,
  } = params

  React.useEffect(() => {
    if (!enabled) {
      return
    }

    const container = containerRef.current

    if (container === null) {
      return
    }

    ensureSingleTabStop(container)

    const observer = new MutationObserver(() => {
      ensureSingleTabStop(container)
    })

    observer.observe(container, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
    }
  }, [containerRef, enabled])

  const onFocus = React.useCallback<React.FocusEventHandler>(
    (event) => {
      if (!enabled || !(event.target instanceof HTMLElement)) {
        return
      }

      const container = containerRef.current

      if (container === null) {
        return
      }

      const candidates = getRovingCandidates(container)
      const targetIndex = candidates.indexOf(event.target)

      if (targetIndex === -1) {
        return
      }

      normalizeTabStops(candidates, targetIndex)
    },
    [containerRef, enabled],
  )

  const onKeyDown = React.useCallback<React.KeyboardEventHandler>(
    (event) => {
      if (!enabled || !(event.target instanceof HTMLElement)) {
        return
      }

      const container = containerRef.current
      if (container === null) {
        return
      }

      const candidates = getRovingCandidates(container)
      const currentIndex = candidates.indexOf(event.target)

      if (currentIndex === -1) {
        return
      }

      let targetIndex: number | null = null

      if (event.key === 'Home') {
        targetIndex = 0
      } else if (event.key === 'End') {
        targetIndex = candidates.length - 1
      } else {
        const direction = getMoveDirection(event.key, orientation)

        if (direction === null) {
          return
        }

        const nextIndex = currentIndex + direction

        if (nextIndex < 0 || nextIndex >= candidates.length) {
          if (!loop) {
            return
          }

          targetIndex = nextIndex < 0 ? candidates.length - 1 : 0
        } else {
          targetIndex = nextIndex
        }
      }

      event.preventDefault()
      normalizeTabStops(candidates, targetIndex)
      candidates[targetIndex]?.focus()
    },
    [containerRef, enabled, loop, orientation],
  )

  return { onFocus, onKeyDown }
}
