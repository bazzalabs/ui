'use client'

import * as React from 'react'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import type { RenderProp } from '../../types.js'
import {
  PlaybackRateMenuDataAttributes,
  PlaybackRateMenuItemDataAttributes,
} from './playback-rate-menu.data-attributes.js'

// ============================================================================
// PlaybackRateMenu Props
// ============================================================================

export const DEFAULT_PLAYBACK_RATES = [
  0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2,
] as const

export interface PlaybackRateMenuProps
  extends React.ComponentPropsWithRef<'div'> {
  /**
   * Available playback rates.
   * @default [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
   */
  rates?: readonly number[]

  render?: RenderProp<PlaybackRateMenuRenderProps, PlaybackRateMenuState>
}

export interface PlaybackRateMenuRenderProps {
  ref: React.Ref<HTMLDivElement>
  role: 'menu'
  'aria-label': string
  [PlaybackRateMenuDataAttributes.rate]: number
}

export interface PlaybackRateMenuState {
  playbackRate: number
  rates: readonly number[]
}

// ============================================================================
// PlaybackRateMenu Component
// ============================================================================

export const PlaybackRateMenu = React.forwardRef<
  HTMLDivElement,
  PlaybackRateMenuProps
>(function PlaybackRateMenu(props, forwardedRef) {
  const {
    rates = DEFAULT_PLAYBACK_RATES,
    render,
    children,
    ...divProps
  } = props
  const context = useVideoPlayerContext('PlaybackRateMenu')

  const state: PlaybackRateMenuState = {
    playbackRate: context.playbackRate,
    rates,
  }

  const renderProps: PlaybackRateMenuRenderProps = {
    ref: forwardedRef,
    role: 'menu',
    'aria-label': 'Playback speed',
    [PlaybackRateMenuDataAttributes.rate]: context.playbackRate,
  }

  if (render) {
    return render(renderProps, state)
  }

  // Default render: simple list of rate options
  return (
    <div {...renderProps} {...divProps}>
      {children ??
        rates.map((rate) => <PlaybackRateMenuItem key={rate} rate={rate} />)}
    </div>
  )
})

// ============================================================================
// PlaybackRateMenuItem
// ============================================================================

export interface PlaybackRateMenuItemProps
  extends React.ComponentPropsWithRef<'button'> {
  rate: number
}

export const PlaybackRateMenuItem = React.forwardRef<
  HTMLButtonElement,
  PlaybackRateMenuItemProps
>(function PlaybackRateMenuItem(props, forwardedRef) {
  const { rate, onClick, children, ...buttonProps } = props
  const context = useVideoPlayerContext('PlaybackRateMenuItem')

  const isActive = context.playbackRate === rate

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (!event.defaultPrevented) {
        context.setPlaybackRate(rate)
      }
    },
    [onClick, context, rate],
  )

  return (
    <button
      ref={forwardedRef}
      type="button"
      role="menuitemradio"
      aria-checked={isActive}
      {...{
        [PlaybackRateMenuItemDataAttributes.active]: isActive || undefined,
      }}
      {...buttonProps}
      onClick={handleClick}
    >
      {children ?? `${rate}x`}
    </button>
  )
})

// ============================================================================
// Namespace
// ============================================================================

export namespace PlaybackRateMenu {
  export type Props = PlaybackRateMenuProps
  export type State = PlaybackRateMenuState
  export type ItemProps = PlaybackRateMenuItemProps
}
