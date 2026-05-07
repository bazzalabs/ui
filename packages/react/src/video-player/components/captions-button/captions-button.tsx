'use client'

import * as React from 'react'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import type { RenderProp } from '../../types.js'
import { CaptionsButtonDataAttributes } from './captions-button.data-attributes.js'

// ============================================================================
// CaptionsButton Props
// ============================================================================

export interface CaptionsButtonProps
  extends React.ComponentPropsWithRef<'button'> {
  render?: RenderProp<CaptionsButtonRenderProps, CaptionsButtonState>
}

export interface CaptionsButtonRenderProps {
  ref: React.Ref<HTMLButtonElement>
  type: 'button'
  'aria-label': string
  'aria-pressed': boolean
  disabled: boolean
  [CaptionsButtonDataAttributes.active]?: boolean
  [CaptionsButtonDataAttributes.available]?: boolean
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export interface CaptionsButtonState {
  active: boolean
  available: boolean
  trackCount: number
}

// ============================================================================
// CaptionsButton Component
// ============================================================================

export const CaptionsButton = React.forwardRef<
  HTMLButtonElement,
  CaptionsButtonProps
>(function CaptionsButton(props, forwardedRef) {
  const { render, onClick, ...buttonProps } = props
  const context = useVideoPlayerContext('CaptionsButton')

  const available = context.registeredTracks.length > 0
  const active = context.activeTextTrack !== null

  const state: CaptionsButtonState = {
    active,
    available,
    trackCount: context.registeredTracks.length,
  }

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (!event.defaultPrevented) {
        if (active) {
          // Turn off captions
          context.setTextTrack(null)
        } else if (context.registeredTracks.length > 0) {
          // Turn on first available track (use the TextTrack reference from TrackInfo)
          const firstTrack = context.registeredTracks[0]
          if (firstTrack?.textTrack) {
            context.setTextTrack(firstTrack.textTrack)
          }
        }
      }
    },
    [onClick, context, active],
  )

  const renderProps: CaptionsButtonRenderProps = {
    ref: forwardedRef,
    type: 'button',
    'aria-label': active ? 'Disable captions' : 'Enable captions',
    'aria-pressed': active,
    disabled: !available,
    [CaptionsButtonDataAttributes.active]: active || undefined,
    [CaptionsButtonDataAttributes.available]: available || undefined,
    onClick: handleClick,
  }

  if (render) {
    return render(renderProps, state)
  }

  return <button {...renderProps} {...buttonProps} />
})

// ============================================================================
// Namespace
// ============================================================================

export namespace CaptionsButton {
  export type Props = CaptionsButtonProps
  export type State = CaptionsButtonState
}
