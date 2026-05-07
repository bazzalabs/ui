'use client'

import * as React from 'react'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import type { RenderProp } from '../../types.js'
import { PlaybackRateButtonDataAttributes } from './playback-rate-button.data-attributes.js'

// ============================================================================
// PlaybackRateButton Props
// ============================================================================

export const DEFAULT_PLAYBACK_RATES = [
  0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2,
] as const

export interface PlaybackRateButtonProps
  extends React.ComponentPropsWithRef<'button'> {
  /**
   * Available playback rates to cycle through.
   * @default [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
   */
  rates?: readonly number[]

  render?: RenderProp<PlaybackRateButtonRenderProps, PlaybackRateButtonState>
}

export interface PlaybackRateButtonRenderProps {
  ref: React.Ref<HTMLButtonElement>
  type: 'button'
  'aria-label': string
  [PlaybackRateButtonDataAttributes.rate]: number
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export interface PlaybackRateButtonState {
  playbackRate: number
  rates: readonly number[]
}

// ============================================================================
// PlaybackRateButton Component
// ============================================================================

export const PlaybackRateButton = React.forwardRef<
  HTMLButtonElement,
  PlaybackRateButtonProps
>(function PlaybackRateButton(props, forwardedRef) {
  const {
    rates = DEFAULT_PLAYBACK_RATES,
    render,
    onClick,
    children,
    ...buttonProps
  } = props
  const context = useVideoPlayerContext('PlaybackRateButton')

  const state: PlaybackRateButtonState = {
    playbackRate: context.playbackRate,
    rates,
  }

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (!event.defaultPrevented) {
        // Find next rate in the cycle
        const currentIndex = rates.indexOf(context.playbackRate)
        const nextIndex = (currentIndex + 1) % rates.length
        const nextRate = rates[nextIndex] ?? rates[0] ?? context.playbackRate
        context.setPlaybackRate(nextRate)
      }
    },
    [onClick, context, rates],
  )

  const renderProps: PlaybackRateButtonRenderProps = {
    ref: forwardedRef,
    type: 'button',
    'aria-label': `Playback speed: ${context.playbackRate}x`,
    [PlaybackRateButtonDataAttributes.rate]: context.playbackRate,
    onClick: handleClick,
  }

  if (render) {
    return render(renderProps, state)
  }

  return (
    <button {...renderProps} {...buttonProps}>
      {children ?? `${context.playbackRate}x`}
    </button>
  )
})

// ============================================================================
// Namespace
// ============================================================================

export namespace PlaybackRateButton {
  export type Props = PlaybackRateButtonProps
  export type State = PlaybackRateButtonState
}
