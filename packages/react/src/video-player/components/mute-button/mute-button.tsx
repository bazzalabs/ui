'use client'

import * as React from 'react'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import type { RenderProp } from '../../types.js'
import { MuteButtonDataAttributes } from './mute-button.data-attributes.js'

// ============================================================================
// MuteButton Props
// ============================================================================

export interface MuteButtonProps extends React.ComponentPropsWithRef<'button'> {
  render?: RenderProp<MuteButtonRenderProps, MuteButtonState>
}

export interface MuteButtonRenderProps {
  ref: React.Ref<HTMLButtonElement>
  type: 'button'
  'aria-label': string
  'aria-pressed': boolean
  [MuteButtonDataAttributes.muted]?: boolean
  [MuteButtonDataAttributes.volumeOff]?: boolean
  [MuteButtonDataAttributes.volumeOn]?: boolean
  [MuteButtonDataAttributes.volumeLow]?: boolean
  [MuteButtonDataAttributes.volumeHigh]?: boolean
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export interface MuteButtonState {
  muted: boolean
  volume: number
}

// ============================================================================
// MuteButton Component
// ============================================================================

export const MuteButton = React.forwardRef<HTMLButtonElement, MuteButtonProps>(
  function MuteButton(props, forwardedRef) {
    const { render, onClick, ...buttonProps } = props
    const context = useVideoPlayerContext('MuteButton')

    const state: MuteButtonState = {
      muted: context.muted,
      volume: context.volume,
    }

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (!event.defaultPrevented) {
          context.toggleMute()
        }
      },
      [onClick, context],
    )

    const volume = context.volume
    const muted = context.muted
    const volumeOff = volume === 0 || muted
    const volumeOn = volume > 0 && !muted
    const volumeLow = !muted && volume > 0 && volume < 0.5
    const volumeHigh = !muted && volume >= 0.5

    const renderProps: MuteButtonRenderProps = {
      ref: forwardedRef,
      type: 'button',
      'aria-label': context.muted ? 'Unmute' : 'Mute',
      'aria-pressed': context.muted,
      [MuteButtonDataAttributes.muted]: muted || undefined,
      [MuteButtonDataAttributes.volumeOff]: volumeOff || undefined,
      [MuteButtonDataAttributes.volumeOn]: volumeOn || undefined,
      [MuteButtonDataAttributes.volumeLow]: volumeLow || undefined,
      [MuteButtonDataAttributes.volumeHigh]: volumeHigh || undefined,
      onClick: handleClick,
    }

    if (render) {
      return render(renderProps, state)
    }

    return <button {...renderProps} {...buttonProps} />
  },
)

// ============================================================================
// Namespace
// ============================================================================

export namespace MuteButton {
  export type Props = MuteButtonProps
  export type State = MuteButtonState
}
