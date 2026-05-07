'use client'

import * as React from 'react'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import type { RenderProp, TrackInfo } from '../../types.js'
import {
  CaptionsMenuDataAttributes,
  CaptionsMenuItemDataAttributes,
} from './captions-menu.data-attributes.js'

// ============================================================================
// CaptionsMenu Props
// ============================================================================

export interface CaptionsMenuProps extends React.ComponentPropsWithRef<'div'> {
  render?: RenderProp<CaptionsMenuRenderProps, CaptionsMenuState>
}

export interface CaptionsMenuRenderProps {
  ref: React.Ref<HTMLDivElement>
  role: 'menu'
  'aria-label': string
  [CaptionsMenuDataAttributes.active]?: boolean
}

export interface CaptionsMenuState {
  registeredTracks: TrackInfo[]
  activeTextTrack: TextTrack | null
}

// ============================================================================
// CaptionsMenu Component
// ============================================================================

export const CaptionsMenu = React.forwardRef<HTMLDivElement, CaptionsMenuProps>(
  function CaptionsMenu(props, forwardedRef) {
    const { render, children, ...divProps } = props
    const context = useVideoPlayerContext('CaptionsMenu')

    const state: CaptionsMenuState = {
      registeredTracks: context.registeredTracks,
      activeTextTrack: context.activeTextTrack,
    }

    const renderProps: CaptionsMenuRenderProps = {
      ref: forwardedRef,
      role: 'menu',
      'aria-label': 'Captions',
      [CaptionsMenuDataAttributes.active]:
        context.activeTextTrack !== null || undefined,
    }

    if (render) {
      return render(renderProps, state)
    }

    // Default render: list of track options with "Off" option
    return (
      <div {...renderProps} {...divProps}>
        {children ?? (
          <>
            <CaptionsMenuItem track={null}>Off</CaptionsMenuItem>
            {context.registeredTracks.map((trackInfo) => (
              <CaptionsMenuItem key={trackInfo.id} track={trackInfo.textTrack}>
                {trackInfo.label}
              </CaptionsMenuItem>
            ))}
          </>
        )}
      </div>
    )
  },
)

// ============================================================================
// CaptionsMenuItem
// ============================================================================

export interface CaptionsMenuItemProps
  extends React.ComponentPropsWithRef<'button'> {
  track: TextTrack | null
}

export const CaptionsMenuItem = React.forwardRef<
  HTMLButtonElement,
  CaptionsMenuItemProps
>(function CaptionsMenuItem(props, forwardedRef) {
  const { track, onClick, children, ...buttonProps } = props
  const context = useVideoPlayerContext('CaptionsMenuItem')

  const isActive = context.activeTextTrack === track

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (!event.defaultPrevented) {
        context.setTextTrack(track)
      }
    },
    [onClick, context, track],
  )

  return (
    <button
      ref={forwardedRef}
      type="button"
      role="menuitemradio"
      aria-checked={isActive}
      {...{ [CaptionsMenuItemDataAttributes.active]: isActive || undefined }}
      {...buttonProps}
      onClick={handleClick}
    >
      {children}
    </button>
  )
})

// ============================================================================
// Namespace
// ============================================================================

export namespace CaptionsMenu {
  export type Props = CaptionsMenuProps
  export type State = CaptionsMenuState
  export type ItemProps = CaptionsMenuItemProps
}
