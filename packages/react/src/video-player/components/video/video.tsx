'use client'

import * as React from 'react'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import { VideoDataAttributes } from './video.data-attributes.js'

// ============================================================================
// Video Props
// ============================================================================

export interface VideoProps
  extends Omit<
    React.ComponentPropsWithRef<'video'>,
    | 'onTimeUpdate'
    | 'onDurationChange'
    | 'onProgress'
    | 'onPlay'
    | 'onPause'
    | 'onEnded'
    | 'onWaiting'
    | 'onCanPlay'
    | 'onSeeking'
    | 'onSeeked'
    | 'onVolumeChange'
    | 'onLoadedMetadata'
  > {
  /**
   * Toggle play/pause when clicking on the video.
   * @default true
   */
  toggleOnClick?: boolean
}

export interface VideoState {
  playing: boolean
  paused: boolean
  ended: boolean
  waiting: boolean
  seeking: boolean
}

// ============================================================================
// Video Component
// ============================================================================

export const Video = React.forwardRef<HTMLVideoElement, VideoProps>(
  function Video(props, forwardedRef) {
    const { toggleOnClick = true, onClick, ...videoProps } = props
    const context = useVideoPlayerContext('Video')

    const hasCheckedMetadata = React.useRef(false)

    const composedRef = React.useCallback(
      (node: HTMLVideoElement | null) => {
        // Set refs
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
        ;(
          context.videoRef as React.MutableRefObject<HTMLVideoElement | null>
        ).current = node

        // Handle race condition: metadata/canplay may have loaded before handlers attached
        // Only check once to avoid infinite loops
        if (node && !hasCheckedMetadata.current) {
          hasCheckedMetadata.current = true

          if (node.readyState >= 1 && node.duration) {
            context._handlers.onLoadedMetadata()
            context._handlers.onDurationChange()
          }

          // readyState >= 3 means HAVE_FUTURE_DATA (canplay)
          // readyState >= 4 means HAVE_ENOUGH_DATA (canplaythrough)
          if (node.readyState >= 3) {
            context._handlers.onCanPlay()
          }
        }
      },
      [forwardedRef, context.videoRef, context._handlers],
    )

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLVideoElement>) => {
        onClick?.(event)
        if (!event.defaultPrevented && toggleOnClick) {
          context.toggle()
        }
      },
      [onClick, toggleOnClick, context],
    )

    // Data attributes
    const dataAttributes = {
      [VideoDataAttributes.playing]: context.playing || undefined,
      [VideoDataAttributes.paused]: context.paused || undefined,
      [VideoDataAttributes.ended]: context.ended || undefined,
      [VideoDataAttributes.waiting]: context.waiting || undefined,
      [VideoDataAttributes.seeking]: context.seeking || undefined,
    }

    return (
      <video
        ref={composedRef}
        preload="metadata"
        {...dataAttributes}
        {...videoProps}
        onClick={handleClick}
        onTimeUpdate={context._handlers.onTimeUpdate}
        onDurationChange={context._handlers.onDurationChange}
        onProgress={context._handlers.onProgress}
        onPlay={context._handlers.onPlay}
        onPause={context._handlers.onPause}
        onEnded={context._handlers.onEnded}
        onWaiting={context._handlers.onWaiting}
        onCanPlay={context._handlers.onCanPlay}
        onSeeking={context._handlers.onSeeking}
        onSeeked={context._handlers.onSeeked}
        onVolumeChange={context._handlers.onVolumeChange}
        onLoadedMetadata={context._handlers.onLoadedMetadata}
      />
    )
  },
)

// ============================================================================
// Namespace
// ============================================================================

export namespace Video {
  export type Props = VideoProps
  export type State = VideoState
}
