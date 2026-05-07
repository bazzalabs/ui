'use client'

import * as React from 'react'

// ============================================================================
// Types
// ============================================================================

export type TransitionStatus = 'starting' | 'ending' | undefined

export interface UseTransitionStatusOptions {
  /**
   * Whether the element should be visible/open.
   */
  open: boolean
  /**
   * Keep the element always mounted in the DOM, even when closed.
   * Only needed for JavaScript animation libraries (e.g., Framer Motion).
   * CSS transitions and animations work automatically without this.
   * @default false
   */
  keepMounted?: boolean
}

export interface UseTransitionStatusReturn {
  /**
   * Whether the element should be rendered in the DOM.
   * Stays true during exit animations.
   */
  mounted: boolean
  /**
   * Current transition status:
   * - 'starting': First frame of enter animation
   * - 'ending': Exit animation in progress
   * - undefined: Idle state
   */
  transitionStatus: TransitionStatus
  /**
   * Ref to attach to the animated element.
   * Used to detect when CSS animations/transitions complete.
   */
  elementRef: React.RefObject<HTMLElement | null>
}

// ============================================================================
// Utility: Wait for Animations
// ============================================================================

/**
 * Returns a promise that resolves when all CSS animations and transitions
 * on the element and its descendants have completed.
 */
function waitForAnimations(element: HTMLElement): Promise<void> {
  // Collect animations from the element and all descendants
  const animations = [
    ...element.getAnimations(),
    ...Array.from(element.querySelectorAll('*')).flatMap((el) =>
      (el as HTMLElement).getAnimations(),
    ),
  ]

  if (animations.length === 0) {
    return Promise.resolve()
  }
  return Promise.all(animations.map((a) => a.finished))
    .then(() => {})
    .catch(() => {
      // Animation was cancelled (e.g., element removed or animation interrupted)
    })
}

// ============================================================================
// Hook: useTransitionStatus
// ============================================================================

export function useTransitionStatus(
  options: UseTransitionStatusOptions,
): UseTransitionStatusReturn {
  const { open, keepMounted = false } = options

  const [mounted, setMounted] = React.useState(open || keepMounted)
  const [transitionStatus, setTransitionStatus] =
    React.useState<TransitionStatus>(open ? 'starting' : undefined)

  const elementRef = React.useRef<HTMLElement | null>(null)

  // Track if we're currently waiting for animations
  const waitingForAnimationsRef = React.useRef(false)

  // Handle open → true (enter)
  React.useEffect(() => {
    if (open) {
      // Cancel any pending exit
      waitingForAnimationsRef.current = false

      setMounted(true)
      setTransitionStatus('starting')

      // Clear starting style after first paint (double RAF for reliability)
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionStatus(undefined)
        })
      })

      return () => cancelAnimationFrame(raf)
    }
  }, [open])

  // Handle open → false (exit)
  React.useEffect(() => {
    if (!open && mounted && !waitingForAnimationsRef.current) {
      setTransitionStatus('ending')

      const element = elementRef.current

      if (!element) {
        // No element ref, unmount immediately
        setTransitionStatus(undefined)
        if (!keepMounted) {
          setMounted(false)
        }
        return
      }

      waitingForAnimationsRef.current = true

      // Wait a frame for the browser to process style changes and start animations
      const raf = requestAnimationFrame(() => {
        // Double RAF for reliability (like enter animation)
        requestAnimationFrame(() => {
          waitForAnimations(element).then(() => {
            // Check if we're still supposed to be unmounting
            // (user might have re-opened during animation)
            if (!waitingForAnimationsRef.current) return

            waitingForAnimationsRef.current = false
            setTransitionStatus(undefined)

            if (!keepMounted) {
              setMounted(false)
            }
          })
        })
      })

      return () => {
        cancelAnimationFrame(raf)
      }
    }
  }, [open, mounted, keepMounted])

  // Handle keepMounted change
  React.useEffect(() => {
    if (keepMounted && !mounted && !open) {
      setMounted(true)
    }
  }, [keepMounted, mounted, open])

  return {
    mounted: mounted || keepMounted,
    transitionStatus,
    elementRef,
  }
}
