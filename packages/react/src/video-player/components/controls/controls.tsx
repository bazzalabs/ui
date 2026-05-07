'use client'

import * as React from 'react'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import { useTransitionStatus } from '../../hooks/use-transition-status.js'
import type { RenderProp } from '../../types.js'
import { ControlsDataAttributes } from './controls.data-attributes.js'

// ============================================================================
// Controls Props
// ============================================================================

export interface ControlsProps
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

  render?: RenderProp<ControlsRenderProps, ControlsState>
  children?: React.ReactNode
}

export interface ControlsRenderProps {
  ref: React.Ref<HTMLDivElement>
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void
  [ControlsDataAttributes.open]?: boolean
  [ControlsDataAttributes.closed]?: boolean
  [ControlsDataAttributes.idle]?: boolean
  [ControlsDataAttributes.playing]?: boolean
  [ControlsDataAttributes.paused]?: boolean
  [ControlsDataAttributes.ended]?: boolean
  [ControlsDataAttributes.startingStyle]?: boolean
  [ControlsDataAttributes.endingStyle]?: boolean
}

export interface ControlsState {
  /** Whether the controls are currently visible */
  open: boolean
  idle: boolean
  playing: boolean
  paused: boolean
  ended: boolean
}

// ============================================================================
// Controls Component
// ============================================================================

export const Controls = React.forwardRef<HTMLDivElement, ControlsProps>(
  function Controls(props, forwardedRef) {
    const {
      idleTimeout: idleTimeoutProp,
      keepMounted = false,
      render,
      children,
      ...divProps
    } = props

    const context = useVideoPlayerContext('Controls')

    // Use component's idleTimeout if set, otherwise use context's
    const effectiveIdleTimeout = idleTimeoutProp ?? context.idleTimeout

    // Calculate visibility:
    // - Open when idleTimeout is 0 (disabled)
    // - Open when not idle
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

    const { onClick, ...restDivProps } = divProps

    // Stop click propagation to prevent Overlay from toggling play/pause
    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation()
        onClick?.(event)
      },
      [onClick],
    )

    const state: ControlsState = {
      open,
      idle: context.idle,
      playing: context.playing,
      paused: context.paused,
      ended: context.ended,
    }

    const renderProps: ControlsRenderProps = {
      ref: composedRef,
      onClick: handleClick,
      [ControlsDataAttributes.open]: open || undefined,
      [ControlsDataAttributes.closed]: !open || undefined,
      [ControlsDataAttributes.idle]: context.idle || undefined,
      [ControlsDataAttributes.playing]: context.playing || undefined,
      [ControlsDataAttributes.paused]: context.paused || undefined,
      [ControlsDataAttributes.ended]: context.ended || undefined,
      [ControlsDataAttributes.startingStyle]:
        transitionStatus === 'starting' || undefined,
      [ControlsDataAttributes.endingStyle]:
        transitionStatus === 'ending' || undefined,
    }

    if (!mounted) {
      return null
    }

    if (render) {
      return render(renderProps, state)
    }

    return (
      <div {...renderProps} {...restDivProps}>
        {children}
      </div>
    )
  },
)

// ============================================================================
// Namespace
// ============================================================================

export namespace Controls {
  export type Props = ControlsProps
  export type State = ControlsState
  export type RenderProps = ControlsRenderProps
}
