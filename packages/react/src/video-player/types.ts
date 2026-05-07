import type * as React from 'react'

// ============================================================================
// Playback Status & Intent
// ============================================================================

/**
 * Mutually exclusive playback states.
 * - 'playing': Video is actively playing
 * - 'paused': Video is paused by user action
 * - 'waiting': Video is buffering/loading (will resume based on playbackIntent)
 * - 'ended': Video has reached the end
 */
export type PlaybackStatus = 'playing' | 'paused' | 'waiting' | 'ended'

/**
 * The user's intended playback state.
 * Persists through transient states like 'waiting' to enable correct resumption.
 * - 'play': User wants the video to play
 * - 'pause': User wants the video to be paused
 */
export type PlaybackIntent = 'play' | 'pause'

// ============================================================================
// Video Quality
// ============================================================================

export interface VideoQuality {
  label: string
  width: number
  height: number
  bitrate?: number
}

// ============================================================================
// Text Track
// ============================================================================

export interface VideoTextTrack {
  kind: TextTrackKind
  label: string
  language: string
  src?: string
}

/**
 * Registered track info from VideoPlayer.Track components.
 * Includes a reference to the native TextTrack for cue access.
 */
export interface TrackInfo {
  /** Unique identifier for this track registration */
  id: string
  /** Track kind (captions, subtitles, descriptions, chapters, metadata) */
  kind: TextTrackKind
  /** Human-readable label */
  label: string
  /** Language code (e.g., 'en', 'es') */
  srcLang: string
  /** Source URL for the track file */
  src: string
  /** Reference to the native TextTrack object (set after track loads) */
  textTrack: TextTrack | null
}

// ============================================================================
// Video Player State
// ============================================================================

export interface VideoPlayerState {
  // Playback - Primary API
  /** Current mutually exclusive playback state */
  playbackStatus: PlaybackStatus
  /** User's intended playback state (persists through 'waiting' state) */
  playbackIntent: PlaybackIntent

  // Playback - Derived booleans (for convenience and backward compatibility)
  /** True when playbackStatus === 'playing' */
  playing: boolean
  /** True when playbackStatus === 'paused' */
  paused: boolean
  /** True when playbackStatus === 'ended' */
  ended: boolean
  /** True when playbackStatus === 'waiting' */
  waiting: boolean

  // Playback - Orthogonal states
  /** True while seeking to a new position (orthogonal to playbackStatus) */
  seeking: boolean
  /** True when video has enough data to begin playback */
  canPlay: boolean

  // Time
  currentTime: number
  duration: number
  buffered: TimeRanges | null
  hoverTime: number | null
  hoverProgress: number | null

  // Audio
  volume: number
  muted: boolean

  // Display
  fullscreen: boolean
  pictureInPicture: boolean
  idle: boolean
  idleTimeout: number
  preventIdleWhenPaused: boolean

  // Captions
  /** Registered tracks from VideoPlayer.Track components */
  registeredTracks: TrackInfo[]
  /** Currently active text track */
  activeTextTrack: TextTrack | null
  /** Currently active cues from the active text track */
  activeCues: VTTCue[]

  // Playback rate
  playbackRate: number

  // Quality (for HLS/DASH)
  qualities: VideoQuality[]
  activeQuality: VideoQuality | null

  // Video element ref
  videoRef: React.RefObject<HTMLVideoElement | null>
  rootRef: React.RefObject<HTMLDivElement | null>
}

// ============================================================================
// Video Player Actions
// ============================================================================

export interface VideoPlayerActions {
  play: () => Promise<void>
  pause: () => void
  toggle: () => Promise<void>
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  enterFullscreen: () => Promise<void>
  exitFullscreen: () => Promise<void>
  toggleFullscreen: () => Promise<void>
  enterPictureInPicture: () => Promise<void>
  exitPictureInPicture: () => Promise<void>
  togglePictureInPicture: () => Promise<void>
  setPlaybackRate: (rate: number) => void
  setTextTrack: (track: TextTrack | null) => void
  setQuality: (quality: VideoQuality) => void
  /** Register a track from VideoPlayer.Track component */
  registerTrack: (track: TrackInfo) => void
  /** Unregister a track when VideoPlayer.Track unmounts */
  unregisterTrack: (id: string) => void
  /** Update a registered track's textTrack reference */
  updateTrackRef: (id: string, textTrack: TextTrack) => void
  /** Reset idle state and restart idle timeout */
  resetIdle: () => void
  /** Set hover time for seek preview (null to clear) */
  setHoverTime: (time: number | null) => void
}

// ============================================================================
// Internal Video Event Handlers
// ============================================================================

export interface VideoPlayerInternalHandlers {
  // Video element handlers
  onTimeUpdate: () => void
  onDurationChange: () => void
  onProgress: () => void
  onPlay: () => void
  onPause: () => void
  onEnded: () => void
  onWaiting: () => void
  onCanPlay: () => void
  onSeeking: () => void
  onSeeked: () => void
  onVolumeChange: () => void
  onLoadedMetadata: () => void
  // Root element handlers
  onRootMouseLeave: () => void
}

// ============================================================================
// Video Player Context
// ============================================================================

export interface VideoPlayerContextValue
  extends VideoPlayerState,
    VideoPlayerActions {
  _handlers: VideoPlayerInternalHandlers
}

// ============================================================================
// External Actions Ref (Base UI pattern)
// ============================================================================

/**
 * Actions exposed via actionsRef for programmatic control.
 * Follows the Base UI actionsRef pattern.
 */
export interface VideoPlayerExternalActions {
  toggle: () => Promise<void>
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleFullscreen: () => Promise<void>
}

// ============================================================================
// Root Props
// ============================================================================

// Omit conflicting native event handlers
type DivPropsWithoutConflicts = Omit<
  React.ComponentPropsWithRef<'div'>,
  'onVolumeChange' | 'onEnded' | 'onWaiting' | 'onSeeking' | 'onSeeked'
>

export interface VideoPlayerRootProps extends DivPropsWithoutConflicts {
  /**
   * Ref to expose programmatic control actions.
   * Follows the Base UI actionsRef pattern.
   */
  actionsRef?: React.RefObject<VideoPlayerExternalActions | null>

  /**
   * Keyboard shortcuts scope.
   * - 'focused': shortcuts work when player is focused (default)
   * - 'global': shortcuts work anywhere on the page
   * - 'none': disable keyboard shortcuts
   * @default 'focused'
   */
  keyboardShortcuts?: 'focused' | 'global' | 'none'

  // Uncontrolled defaults
  defaultPlaying?: boolean
  defaultVolume?: number
  defaultMuted?: boolean
  defaultPlaybackRate?: number

  // Controlled
  playing?: boolean
  onPlayingChange?: (playing: boolean) => void
  volume?: number
  onVolumeChange?: (volume: number) => void
  muted?: boolean
  onMutedChange?: (muted: boolean) => void
  playbackRate?: number
  onPlaybackRateChange?: (rate: number) => void
  currentTime?: number
  onCurrentTimeChange?: (time: number) => void

  // Idle detection
  /**
   * Time in milliseconds before the player is considered idle.
   * Set to 0 to disable idle detection.
   * @default 3000
   */
  idleTimeout?: number
  /**
   * When true, prevents the player from going idle while paused.
   * @default false
   */
  preventIdleWhenPaused?: boolean
  /**
   * Controls cursor auto-hiding behavior when the player is idle.
   * - 'fullscreen': hide cursor only when in fullscreen mode and idle (default)
   * - 'always': hide cursor when idle in any mode
   * - false: never auto-hide cursor
   * @default 'fullscreen'
   */
  hideCursorWhenIdle?: 'always' | 'fullscreen' | false
  idle?: boolean
  onIdleChange?: (idle: boolean) => void

  // Events
  onEnded?: () => void
  onWaiting?: () => void
  onSeeking?: () => void
  onSeeked?: () => void
  onFullscreenChange?: (fullscreen: boolean) => void
  onPictureInPictureChange?: (pip: boolean) => void
}

// ============================================================================
// Render Prop Pattern
// ============================================================================

/**
 * Render prop pattern following Base UI's approach.
 * @param props - Props to spread on the rendered element (includes ref, handlers, aria attrs)
 * @param state - Component state for conditional rendering
 */
export type RenderProp<
  Props = Record<string, unknown>,
  State = Record<string, unknown>,
> = (props: Props, state: State) => React.ReactElement
