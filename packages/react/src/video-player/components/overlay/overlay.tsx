'use client'

import * as React from 'react'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import { useTransitionStatus } from '../../hooks/use-transition-status.js'
import type { RenderProp } from '../../types.js'
import { OverlayDataAttributes } from './overlay.data-attributes.js'

// ============================================================================
// Overlay Props
// ============================================================================

export interface OverlayProps
  extends Omit<React.ComponentPropsWithRef<'div'>, 'children'> {
  /**
   * Delay before hiding after player becomes idle (ms).
   * Defaults to Root's idleTimeout. Set to 0 to disable auto-hide.
   */
  idleTimeout?: number

  /**
   * Keep the element always mounted in the DOM, even when closed.
   * Only needed for JavaScript animation libraries (e.g., Framer Motion).
   * CSS transitions and animations work automatically without this.
   * @default false
   */
  keepMounted?: boolean

  render?: RenderProp<OverlayRenderProps, OverlayState>
  children?: React.ReactNode
}

export interface OverlayRenderProps {
  ref: React.Ref<HTMLDivElement>
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void
  [OverlayDataAttributes.playing]?: boolean
  [OverlayDataAttributes.paused]?: boolean
  [OverlayDataAttributes.ended]?: boolean
  [OverlayDataAttributes.waiting]?: boolean
  [OverlayDataAttributes.seeking]?: boolean
  [OverlayDataAttributes.fullscreen]?: boolean
  [OverlayDataAttributes.pip]?: boolean
  [OverlayDataAttributes.open]?: boolean
  [OverlayDataAttributes.closed]?: boolean
  [OverlayDataAttributes.startingStyle]?: boolean
  [OverlayDataAttributes.endingStyle]?: boolean
}

export interface OverlayState {
  playing: boolean
  paused: boolean
  ended: boolean
  waiting: boolean
  seeking: boolean
  fullscreen: boolean
  pictureInPicture: boolean
  /** Whether the overlay is currently visible (opposite of idle) */
  open: boolean
}

// ============================================================================
// Overlay Component
// ============================================================================

export const Overlay = React.forwardRef<HTMLDivElement, OverlayProps>(
  function Overlay(props, forwardedRef) {
    const {
      idleTimeout: idleTimeoutProp,
      keepMounted = false,
      render,
      onClick,
      children,
      ...divProps
    } = props
    const context = useVideoPlayerContext('Overlay')

    // Use component's idleTimeout if set, otherwise use context's
    const effectiveIdleTimeout = idleTimeoutProp ?? context.idleTimeout

    // Determine visibility: open when not idle, or when idleTimeout is 0 (disabled)
    const open = effectiveIdleTimeout === 0 || !context.idle

    // Handle transition status for animations
    const { mounted, transitionStatus, elementRef } = useTransitionStatus({
      open,
      keepMounted,
    })

    // Compose refs
    const composedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        ;(elementRef as React.MutableRefObject<HTMLElement | null>).current =
          node
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
      },
      [forwardedRef, elementRef],
    )

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        onClick?.(event)
        if (!event.defaultPrevented) {
          context.toggle()
        }
      },
      [onClick, context],
    )

    const state: OverlayState = {
      playing: context.playing,
      paused: context.paused,
      ended: context.ended,
      waiting: context.waiting,
      seeking: context.seeking,
      fullscreen: context.fullscreen,
      pictureInPicture: context.pictureInPicture,
      open,
    }

    const renderProps: OverlayRenderProps = {
      ref: composedRef,
      onClick: handleClick,
      [OverlayDataAttributes.playing]: context.playing || undefined,
      [OverlayDataAttributes.paused]: context.paused || undefined,
      [OverlayDataAttributes.ended]: context.ended || undefined,
      [OverlayDataAttributes.waiting]: context.waiting || undefined,
      [OverlayDataAttributes.seeking]: context.seeking || undefined,
      [OverlayDataAttributes.fullscreen]: context.fullscreen || undefined,
      [OverlayDataAttributes.pip]: context.pictureInPicture || undefined,
      [OverlayDataAttributes.open]: open || undefined,
      [OverlayDataAttributes.closed]: !open || undefined,
      [OverlayDataAttributes.startingStyle]:
        transitionStatus === 'starting' || undefined,
      [OverlayDataAttributes.endingStyle]:
        transitionStatus === 'ending' || undefined,
    }

    if (!mounted) {
      return null
    }

    if (render) {
      return render(renderProps, state)
    }

    return (
      <div {...renderProps} {...divProps}>
        {children}
      </div>
    )
  },
)

// ============================================================================
// Namespace
// ============================================================================

export namespace Overlay {
  export type Props = OverlayProps
  export type State = OverlayState
  export type RenderProps = OverlayRenderProps
}
