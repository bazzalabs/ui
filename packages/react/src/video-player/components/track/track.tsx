'use client'

import * as React from 'react'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import type { TrackInfo } from '../../types.js'

// ============================================================================
// Track Props
// ============================================================================

export interface TrackProps
  extends Omit<React.ComponentPropsWithRef<'track'>, 'kind'> {
  /** Track kind (defaults to 'captions') */
  kind?: TextTrackKind
  /** Source URL for the track file (.vtt) */
  src: string
  /** Human-readable label displayed in caption menus */
  label: string
  /** Language code (e.g., 'en', 'es', 'fr') */
  srcLang: string
  /** Set as the default track (auto-enabled) */
  default?: boolean
}

// ============================================================================
// Track Component
// ============================================================================

/**
 * Wraps native <track> element and registers with VideoPlayer context.
 * Must be used as a child of VideoPlayer.Video.
 *
 * @example
 * <VideoPlayer.Video>
 *   <VideoPlayer.Track
 *     kind="captions"
 *     src="/captions-en.vtt"
 *     label="English"
 *     srcLang="en"
 *   />
 * </VideoPlayer.Video>
 */
export const Track = React.forwardRef<HTMLTrackElement, TrackProps>(
  function Track(props, forwardedRef) {
    const {
      kind = 'captions',
      src,
      label,
      srcLang,
      default: isDefault,
      ...trackProps
    } = props

    const { registerTrack, unregisterTrack, updateTrackRef, setTextTrack } =
      useVideoPlayerContext('Track')
    const trackRef = React.useRef<HTMLTrackElement>(null)

    // Generate stable ID for this track registration
    const trackId = React.useId()

    // Compose refs
    const composedRef = React.useCallback(
      (node: HTMLTrackElement | null) => {
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
        ;(trackRef as React.MutableRefObject<HTMLTrackElement | null>).current =
          node
      },
      [forwardedRef],
    )

    // Register track with context on mount
    React.useEffect(() => {
      const trackInfo: TrackInfo = {
        id: trackId,
        kind,
        label,
        srcLang,
        src,
        textTrack: null, // Will be updated once track loads
      }

      registerTrack(trackInfo)

      return () => {
        unregisterTrack(trackId)
      }
    }, [trackId, kind, label, srcLang, src, registerTrack, unregisterTrack])

    // Update textTrack reference once the track element is ready
    React.useEffect(() => {
      const trackElement = trackRef.current
      if (!trackElement) return

      // The track property gives us the TextTrack object
      const handleUpdateRef = () => {
        if (trackElement.track) {
          // Disable the track by default to prevent native browser captions
          // It will be enabled via setTextTrack when user activates it
          trackElement.track.mode = 'disabled'

          updateTrackRef(trackId, trackElement.track)

          // If this is the default track, set it as active
          if (isDefault) {
            setTextTrack(trackElement.track)
          }
        }
      }

      // Check if already loaded
      if (trackElement.track) {
        handleUpdateRef()
      }

      // Also listen for load event in case it's not ready yet
      trackElement.addEventListener('load', handleUpdateRef)
      return () => {
        trackElement.removeEventListener('load', handleUpdateRef)
      }
    }, [trackId, isDefault, updateTrackRef, setTextTrack])

    return (
      <track
        ref={composedRef}
        kind={kind}
        src={src}
        label={label}
        srcLang={srcLang}
        default={isDefault}
        {...trackProps}
      />
    )
  },
)

// ============================================================================
// Namespace
// ============================================================================

export namespace Track {
  export type Props = TrackProps
}
