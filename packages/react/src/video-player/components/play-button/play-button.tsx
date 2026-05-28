'use client'

import * as React from 'react'
import type { WithPreventableBaseHandlers } from '../../../utils/types.js'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import type { RenderProp } from '../../types.js'
import { mergeElementProps } from '../../utils/merge-element-props.js'
import { PlayButtonDataAttributes } from './play-button.data-attributes.js'

// ============================================================================
// PlayButton Props
// ============================================================================

export interface PlayButtonProps
  extends Omit<
    WithPreventableBaseHandlers<React.ComponentPropsWithRef<'button'>>,
    'children'
  > {
  render?: RenderProp<PlayButtonRenderProps, PlayButtonState>
  children?: React.ReactNode
}

export interface PlayButtonRenderProps {
  ref: React.Ref<HTMLButtonElement>
  type: React.ButtonHTMLAttributes<HTMLButtonElement>['type']
  'aria-label': string
  [PlayButtonDataAttributes.playing]?: boolean
  [PlayButtonDataAttributes.paused]?: boolean
  [PlayButtonDataAttributes.ended]?: boolean
  [PlayButtonDataAttributes.waiting]?: boolean
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export interface PlayButtonState {
  playing: boolean
  paused: boolean
  ended: boolean
  waiting: boolean
}

// ============================================================================
// PlayButton Component
// ============================================================================

export const PlayButton = React.forwardRef<HTMLButtonElement, PlayButtonProps>(
  function PlayButton(props, forwardedRef) {
    const { render, children, ...buttonProps } = props
    const context = useVideoPlayerContext('PlayButton')

    const state: PlayButtonState = {
      playing: context.playing,
      paused: context.paused,
      ended: context.ended,
      waiting: context.waiting,
    }

    const renderProps = mergeElementProps(
      {
        ref: forwardedRef,
        type: 'button',
        'aria-label': context.playing ? 'Pause' : 'Play',
        [PlayButtonDataAttributes.playing]: context.playing || undefined,
        [PlayButtonDataAttributes.paused]: context.paused || undefined,
        [PlayButtonDataAttributes.ended]: context.ended || undefined,
        [PlayButtonDataAttributes.waiting]: context.waiting || undefined,
        onClick() {
          context.toggle()
        },
      },
      buttonProps,
    )

    if (render) {
      return render(renderProps, state)
    }

    return <button {...renderProps}>{children}</button>
  },
)

// ============================================================================
// Namespace
// ============================================================================

export namespace PlayButton {
  export type Props = PlayButtonProps
  export type State = PlayButtonState
  export type RenderProps = PlayButtonRenderProps
}
