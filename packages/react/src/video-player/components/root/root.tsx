'use client'

import { mergeProps } from '@base-ui/react/merge-props'
import * as React from 'react'
import { VideoPlayerContext } from '../../contexts/video-player-context.js'
import { useKeyboardShortcuts } from '../../hooks/use-keyboard-shortcuts.js'
import { useVideoPlayer } from '../../hooks/use-video-player.js'
import type {
  PlaybackIntent,
  PlaybackStatus,
  TrackInfo,
  VideoPlayerContextValue,
  VideoPlayerRootProps,
  VideoQuality,
} from '../../types.js'
import { RootDataAttributes } from './root.data-attributes.js'

// ============================================================================
// Hook: useControllableState
// ============================================================================

function useControllableState<T>(
  controlledValue: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue

  const setValue = React.useCallback(
    (nextValue: T | ((prev: T) => T)) => {
      const newValue =
        typeof nextValue === 'function'
          ? (nextValue as (prev: T) => T)(value)
          : nextValue

      if (!isControlled) {
        setUncontrolledValue(newValue)
      }
      onChange?.(newValue)
    },
    [isControlled, value, onChange],
  )

  return [value, setValue]
}

// ============================================================================
// Root Props Interface
// ============================================================================

export interface VideoPlayerRootState {
  playbackStatus: PlaybackStatus
  playbackIntent: PlaybackIntent
  playing: boolean
  paused: boolean
  ended: boolean
  waiting: boolean
  seeking: boolean
  canPlay: boolean
  fullscreen: boolean
  pictureInPicture: boolean
  muted: boolean
  volume: number
  currentTime: number
  duration: number
  playbackRate: number
  idle: boolean
  idleTimeout: number
}

// ============================================================================
// Provider Component (internal - wraps Root with context)
// ============================================================================

interface VideoPlayerProviderProps extends VideoPlayerRootProps {
  rootRef: React.RefObject<HTMLDivElement | null>
  videoRef: React.RefObject<HTMLVideoElement | null>
}

function VideoPlayerProvider({
  // Refs from Root
  rootRef,
  videoRef,

  // Actions ref
  actionsRef,

  // Uncontrolled defaults
  defaultPlaying = false,
  defaultVolume = 1,
  defaultMuted = false,
  defaultPlaybackRate = 1,

  // Controlled values
  playing: controlledPlaying,
  onPlayingChange,
  volume: controlledVolume,
  onVolumeChange,
  muted: controlledMuted,
  onMutedChange,
  playbackRate: controlledPlaybackRate,
  onPlaybackRateChange,
  currentTime: controlledCurrentTime,
  onCurrentTimeChange,

  // Idle detection
  idleTimeout = 3000,
  preventIdleWhenPaused = false,
  idle: controlledIdle,
  onIdleChange,

  // Events
  onEnded,
  onWaiting,
  onSeeking,
  onSeeked,
  onFullscreenChange,
  onPictureInPictureChange,

  // Children
  children,
}: VideoPlayerProviderProps) {
  // Refs
  const previousVolumeRef = React.useRef(1)
  const isSeekInteractionRef = React.useRef(false)
  const shouldResumeAfterSeekRef = React.useRef(false)

  // Controllable state
  // Note: We use playbackStatus internally but still support the controlled `playing` prop
  // for backward compatibility. The `playing` prop maps to playbackIntent.
  const [playbackStatus, setPlaybackStatus] =
    React.useState<PlaybackStatus>('paused')
  const [playbackIntent, setPlaybackIntent] = React.useState<PlaybackIntent>(
    defaultPlaying ? 'play' : 'pause',
  )

  // Sync playbackStatus when controlled `playing` prop changes
  React.useEffect(() => {
    if (controlledPlaying !== undefined) {
      setPlaybackIntent(controlledPlaying ? 'play' : 'pause')
      // Only update status if not in a transient state like 'waiting'
      if (playbackStatus !== 'waiting') {
        setPlaybackStatus(controlledPlaying ? 'playing' : 'paused')
      }
    }
  }, [controlledPlaying, playbackStatus])
  const [volume, setVolume] = useControllableState(
    controlledVolume,
    defaultVolume,
    onVolumeChange,
  )
  const [muted, setMuted] = useControllableState(
    controlledMuted,
    defaultMuted,
    onMutedChange,
  )
  const [playbackRate, setPlaybackRateState] = useControllableState(
    controlledPlaybackRate,
    defaultPlaybackRate,
    onPlaybackRateChange,
  )
  const [idle, setIdle] = useControllableState(
    controlledIdle,
    true, // Start idle (controls hidden until interaction)
    onIdleChange,
  )

  // Idle timeout ref
  const idleTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  const clearIdleTimeout = React.useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current)
      idleTimeoutRef.current = null
    }
  }, [])

  const startIdleTimeout = React.useCallback(() => {
    if (idleTimeout === 0) return

    clearIdleTimeout()
    idleTimeoutRef.current = setTimeout(() => {
      setIdle(true)
    }, idleTimeout)
  }, [idleTimeout, clearIdleTimeout, setIdle])

  const resetIdle = React.useCallback(() => {
    setIdle(false)
    startIdleTimeout()
  }, [setIdle, startIdleTimeout])

  const handleRootMouseLeave = React.useCallback(() => {
    clearIdleTimeout()
    setIdle(true)
  }, [clearIdleTimeout, setIdle])

  // Start idle timeout on mount, cleanup on unmount
  // biome-ignore lint/correctness/useExhaustiveDependencies: allowed
  React.useEffect(() => {
    if (idleTimeout > 0) {
      idleTimeoutRef.current = setTimeout(() => {
        setIdle(true)
      }, idleTimeout)
    }
    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current)
      }
    }
  }, [])

  // Compute effective idle state synchronously to prevent flicker
  // When preventIdleWhenPaused is enabled and video is not playing, never be idle
  const effectiveIdle =
    preventIdleWhenPaused && playbackStatus !== 'playing' ? false : idle

  // Internal state (not controllable)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [buffered, setBuffered] = React.useState<TimeRanges | null>(null)
  const [hoverTime, setHoverTime] = React.useState<number | null>(null)
  const [canPlay, setCanPlay] = React.useState(false)
  const [seeking, setSeeking] = React.useState(false)
  const [fullscreen, setFullscreen] = React.useState(false)
  const [pictureInPicture, setPictureInPicture] = React.useState(false)
  const [registeredTracks, setRegisteredTracks] = React.useState<TrackInfo[]>(
    [],
  )
  const [activeTextTrack, setActiveTextTrack] =
    React.useState<TextTrack | null>(null)
  const [activeCues, setActiveCues] = React.useState<VTTCue[]>([])
  const [qualities, _setQualities] = React.useState<VideoQuality[]>([])
  const [activeQuality, setActiveQuality] = React.useState<VideoQuality | null>(
    null,
  )

  // Sync controlled currentTime if provided
  React.useEffect(() => {
    if (controlledCurrentTime !== undefined && videoRef.current) {
      videoRef.current.currentTime = controlledCurrentTime
    }
  }, [controlledCurrentTime, videoRef])

  // Fullscreen change listener
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement === rootRef.current
      setFullscreen(isFullscreen)
      onFullscreenChange?.(isFullscreen)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [onFullscreenChange, rootRef])

  // PiP change listener
  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePiPEnter = () => {
      setPictureInPicture(true)
      onPictureInPictureChange?.(true)
    }
    const handlePiPLeave = () => {
      setPictureInPicture(false)
      onPictureInPictureChange?.(false)
    }

    video.addEventListener('enterpictureinpicture', handlePiPEnter)
    video.addEventListener('leavepictureinpicture', handlePiPLeave)
    return () => {
      video.removeEventListener('enterpictureinpicture', handlePiPEnter)
      video.removeEventListener('leavepictureinpicture', handlePiPLeave)
    }
  }, [onPictureInPictureChange, videoRef])

  // Actions
  const play = React.useCallback(async () => {
    if (videoRef.current) {
      setPlaybackIntent('play')
      await videoRef.current.play()
      setPlaybackStatus('playing')
      onPlayingChange?.(true)
    }
  }, [videoRef, onPlayingChange])

  const pause = React.useCallback(() => {
    if (videoRef.current) {
      setPlaybackIntent('pause')
      videoRef.current.pause()
      setPlaybackStatus('paused')
      onPlayingChange?.(false)
    }
  }, [videoRef, onPlayingChange])

  const toggle = React.useCallback(async () => {
    if (playbackStatus === 'playing') {
      pause()
    } else {
      await play()
    }
  }, [playbackStatus, play, pause])

  const seek = React.useCallback(
    (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time
        setCurrentTime(time)
        onCurrentTimeChange?.(time)
      }
    },
    [onCurrentTimeChange, videoRef],
  )

  const beginSeekInteraction = React.useCallback(() => {
    const video = videoRef.current
    if (!video || isSeekInteractionRef.current) {
      return
    }

    isSeekInteractionRef.current = true
    shouldResumeAfterSeekRef.current = playbackIntent === 'play'
    setSeeking(true)

    if (shouldResumeAfterSeekRef.current && !video.paused) {
      video.pause()
    }
  }, [playbackIntent, videoRef])

  const endSeekInteraction = React.useCallback(() => {
    const video = videoRef.current
    if (!video || !isSeekInteractionRef.current) {
      return
    }

    const shouldResume =
      shouldResumeAfterSeekRef.current && playbackIntent === 'play'
    isSeekInteractionRef.current = false
    shouldResumeAfterSeekRef.current = false

    if (!shouldResume) {
      setSeeking(false)
      return
    }

    void video
      .play()
      .then(() => {
        setPlaybackStatus('playing')
        setSeeking(false)
      })
      .catch(() => {
        setPlaybackStatus('waiting')
        setSeeking(false)
      })
  }, [playbackIntent, videoRef])

  const handleSetVolume = React.useCallback(
    (vol: number) => {
      const clampedVolume = Math.max(0, Math.min(1, vol))
      if (videoRef.current) {
        videoRef.current.volume = clampedVolume
      }
      setVolume(clampedVolume)
    },
    [setVolume, videoRef],
  )

  const toggleMute = React.useCallback(() => {
    // Treat volume === 0 the same as muted for toggle purposes
    const effectivelyMuted = muted || volume === 0

    if (!effectivelyMuted) {
      // Muting - save current volume for restoration
      previousVolumeRef.current = volume
      if (videoRef.current) {
        videoRef.current.muted = true
      }
      setMuted(true)
    } else {
      // Unmuting - restore previous volume, or max if previous was 0
      const restoreVolume =
        previousVolumeRef.current > 0 ? previousVolumeRef.current : 1
      if (videoRef.current) {
        videoRef.current.volume = restoreVolume
        videoRef.current.muted = false
      }
      setVolume(restoreVolume)
      setMuted(false)
    }
  }, [muted, volume, setMuted, setVolume, videoRef])

  const enterFullscreen = React.useCallback(async () => {
    if (rootRef.current?.requestFullscreen) {
      await rootRef.current.requestFullscreen()
    }
  }, [rootRef])

  const exitFullscreen = React.useCallback(async () => {
    if (document.exitFullscreen) {
      await document.exitFullscreen()
    }
  }, [])

  const toggleFullscreen = React.useCallback(async () => {
    if (fullscreen) {
      await exitFullscreen()
    } else {
      await enterFullscreen()
    }
  }, [fullscreen, enterFullscreen, exitFullscreen])

  const enterPictureInPicture = React.useCallback(async () => {
    if (videoRef.current?.requestPictureInPicture) {
      await videoRef.current.requestPictureInPicture()
    }
  }, [videoRef])

  const exitPictureInPicture = React.useCallback(async () => {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture()
    }
  }, [])

  const togglePictureInPicture = React.useCallback(async () => {
    if (pictureInPicture) {
      await exitPictureInPicture()
    } else {
      await enterPictureInPicture()
    }
  }, [pictureInPicture, enterPictureInPicture, exitPictureInPicture])

  const setPlaybackRate = React.useCallback(
    (rate: number) => {
      if (videoRef.current) {
        videoRef.current.playbackRate = rate
      }
      setPlaybackRateState(rate)
    },
    [setPlaybackRateState, videoRef],
  )

  const setTextTrack = React.useCallback(
    (track: TextTrack | null) => {
      // Disable all tracks first
      if (videoRef.current) {
        for (let i = 0; i < videoRef.current.textTracks.length; i++) {
          const textTrack = videoRef.current.textTracks[i]
          if (textTrack) {
            textTrack.mode = 'disabled'
          }
        }
        // Enable selected track in 'hidden' mode
        // 'hidden' fires cuechange events but doesn't render native captions
        // allowing our custom Captions component to handle rendering
        if (track) {
          track.mode = 'hidden'
        }
      }
      setActiveTextTrack(track)
      // Clear active cues when switching tracks
      setActiveCues([])
    },
    [videoRef],
  )

  const setQuality = React.useCallback((quality: VideoQuality) => {
    // Quality switching requires HLS/DASH library integration
    // This is a placeholder for the action
    setActiveQuality(quality)
  }, [])

  // Track registration actions (for VideoPlayer.Track component)
  const registerTrack = React.useCallback((track: TrackInfo) => {
    setRegisteredTracks((prev) => {
      // Avoid duplicates
      if (prev.some((t) => t.id === track.id)) return prev
      return [...prev, track]
    })
  }, [])

  const unregisterTrack = React.useCallback((id: string) => {
    setRegisteredTracks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const updateTrackRef = React.useCallback(
    (id: string, textTrack: TextTrack) => {
      setRegisteredTracks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, textTrack } : t)),
      )
    },
    [],
  )

  // Cuechange event listener - updates activeCues when cues change
  React.useEffect(() => {
    if (!activeTextTrack) {
      setActiveCues([])
      return
    }

    const handleCueChange = () => {
      const cues = activeTextTrack.activeCues
      if (!cues) {
        setActiveCues([])
        return
      }
      // Convert CueList to array of VTTCue
      const cueArray: VTTCue[] = []
      for (let i = 0; i < cues.length; i++) {
        const cue = cues[i]
        if (cue instanceof VTTCue) {
          cueArray.push(cue)
        }
      }
      setActiveCues(cueArray)
    }

    // Initial check for any active cues
    handleCueChange()

    activeTextTrack.addEventListener('cuechange', handleCueChange)
    return () => {
      activeTextTrack.removeEventListener('cuechange', handleCueChange)
    }
  }, [activeTextTrack])

  // Populate actionsRef for external control (Base UI pattern)
  React.useImperativeHandle(
    actionsRef,
    () => ({
      toggle,
      seek,
      setVolume: handleSetVolume,
      toggleFullscreen,
    }),
    [toggle, seek, handleSetVolume, toggleFullscreen],
  )

  // Video event handlers (to be called by Video component)
  const handleTimeUpdate = React.useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime
      setCurrentTime(time)
      onCurrentTimeChange?.(time)
    }
  }, [onCurrentTimeChange, videoRef])

  const handleDurationChange = React.useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }, [videoRef])

  const handleProgress = React.useCallback(() => {
    if (videoRef.current) {
      setBuffered(videoRef.current.buffered)
    }
  }, [videoRef])

  const handlePlay = React.useCallback(() => {
    setPlaybackIntent('play')
    setPlaybackStatus('playing')
    onPlayingChange?.(true)
  }, [onPlayingChange])

  const handlePause = React.useCallback(() => {
    if (isSeekInteractionRef.current) {
      return
    }

    // Only set to paused if not ended (ended takes precedence)
    if (playbackStatus !== 'ended') {
      setPlaybackStatus('paused')
      onPlayingChange?.(false)
    }
  }, [playbackStatus, onPlayingChange])

  const handleEnded = React.useCallback(() => {
    setPlaybackIntent('pause')
    setPlaybackStatus('ended')
    onPlayingChange?.(false)
    onEnded?.()
  }, [onPlayingChange, onEnded])

  const handleWaiting = React.useCallback(() => {
    if (isSeekInteractionRef.current) {
      return
    }

    setPlaybackStatus('waiting')
    onWaiting?.()
  }, [onWaiting])

  const handleCanPlay = React.useCallback(() => {
    if (isSeekInteractionRef.current) {
      setCanPlay(true)
      return
    }

    // Resume based on intent when exiting waiting state
    if (playbackStatus === 'waiting') {
      const resumeStatus = playbackIntent === 'play' ? 'playing' : 'paused'
      setPlaybackStatus(resumeStatus)
      onPlayingChange?.(resumeStatus === 'playing')
    }
    setCanPlay(true)
  }, [playbackStatus, playbackIntent, onPlayingChange])

  const handleSeeking = React.useCallback(() => {
    setSeeking(true)
    // Clear ended state when user seeks
    if (playbackStatus === 'ended') {
      setPlaybackStatus('paused')
    }
    onSeeking?.()
  }, [playbackStatus, onSeeking])

  const handleSeeked = React.useCallback(() => {
    setSeeking(false)
    // Check if we've seeked to the end (small epsilon for floating point precision)
    if (videoRef.current) {
      const { currentTime, duration } = videoRef.current
      if (duration > 0 && duration - currentTime < 0.01) {
        setPlaybackStatus('ended')
      }
    }
    onSeeked?.()
  }, [onSeeked, videoRef])

  const handleVolumeChange = React.useCallback(() => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume)
      setMuted(videoRef.current.muted)
    }
  }, [setVolume, setMuted, videoRef])

  const handleLoadedMetadata = React.useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      // Note: Text tracks are now registered via VideoPlayer.Track components
      // instead of being auto-discovered from the video element
    }
  }, [videoRef])

  // Context value
  const contextValue = React.useMemo<VideoPlayerContextValue>(
    () => ({
      // Playback - Primary API
      playbackStatus,
      playbackIntent,

      // Playback - Derived booleans (backward compatibility)
      playing: playbackStatus === 'playing',
      paused: playbackStatus === 'paused',
      ended: playbackStatus === 'ended',
      waiting: playbackStatus === 'waiting',

      // Playback - Orthogonal states
      seeking,
      canPlay,
      currentTime,
      duration,
      buffered,
      hoverTime,
      hoverProgress:
        hoverTime !== null && duration > 0
          ? (hoverTime / duration) * 100
          : null,
      volume,
      muted,
      fullscreen,
      pictureInPicture,
      idle: effectiveIdle,
      idleTimeout,
      preventIdleWhenPaused,
      registeredTracks,
      activeTextTrack,
      activeCues,
      playbackRate,
      qualities,
      activeQuality,
      videoRef,
      rootRef,

      // Actions
      play,
      pause,
      toggle,
      seek,
      setVolume: handleSetVolume,
      toggleMute,
      enterFullscreen,
      exitFullscreen,
      toggleFullscreen,
      enterPictureInPicture,
      exitPictureInPicture,
      togglePictureInPicture,
      setPlaybackRate,
      setTextTrack,
      setQuality,
      registerTrack,
      unregisterTrack,
      updateTrackRef,
      resetIdle,
      setHoverTime,
      beginSeekInteraction,
      endSeekInteraction,

      // Internal event handlers
      _handlers: {
        // Video element handlers
        onTimeUpdate: handleTimeUpdate,
        onDurationChange: handleDurationChange,
        onProgress: handleProgress,
        onPlay: handlePlay,
        onPause: handlePause,
        onEnded: handleEnded,
        onWaiting: handleWaiting,
        onCanPlay: handleCanPlay,
        onSeeking: handleSeeking,
        onSeeked: handleSeeked,
        onVolumeChange: handleVolumeChange,
        onLoadedMetadata: handleLoadedMetadata,
        // Root element handlers
        onRootMouseLeave: handleRootMouseLeave,
      },
    }),
    [
      playbackStatus,
      playbackIntent,
      seeking,
      canPlay,
      currentTime,
      duration,
      buffered,
      hoverTime,
      volume,
      muted,
      fullscreen,
      pictureInPicture,
      effectiveIdle,
      idleTimeout,
      preventIdleWhenPaused,
      registeredTracks,
      activeTextTrack,
      activeCues,
      playbackRate,
      qualities,
      activeQuality,
      videoRef,
      rootRef,
      play,
      pause,
      toggle,
      seek,
      handleSetVolume,
      toggleMute,
      enterFullscreen,
      exitFullscreen,
      toggleFullscreen,
      enterPictureInPicture,
      exitPictureInPicture,
      togglePictureInPicture,
      setPlaybackRate,
      setTextTrack,
      setQuality,
      registerTrack,
      unregisterTrack,
      updateTrackRef,
      resetIdle,
      beginSeekInteraction,
      endSeekInteraction,
      handleTimeUpdate,
      handleDurationChange,
      handleProgress,
      handlePlay,
      handlePause,
      handleEnded,
      handleWaiting,
      handleCanPlay,
      handleSeeking,
      handleSeeked,
      handleVolumeChange,
      handleLoadedMetadata,
      handleRootMouseLeave,
    ],
  )

  return (
    <VideoPlayerContext.Provider value={contextValue}>
      {children}
    </VideoPlayerContext.Provider>
  )
}

// ============================================================================
// Root Component
// ============================================================================

export const VideoPlayerRoot = React.forwardRef<
  HTMLDivElement,
  VideoPlayerRootProps
>(function VideoPlayerRoot(props, forwardedRef) {
  const {
    // Actions ref
    actionsRef,
    keyboardShortcuts = 'focused',

    // Uncontrolled defaults
    defaultPlaying,
    defaultVolume,
    defaultMuted,
    defaultPlaybackRate,

    // Controlled values
    playing,
    onPlayingChange,
    volume,
    onVolumeChange,
    muted,
    onMutedChange,
    playbackRate,
    onPlaybackRateChange,
    currentTime,
    onCurrentTimeChange,

    // Idle detection
    idleTimeout,
    preventIdleWhenPaused,
    hideCursorWhenIdle = 'fullscreen',
    idle,
    onIdleChange,

    // Events
    onEnded,
    onWaiting,
    onSeeking,
    onSeeked,
    onFullscreenChange,
    onPictureInPictureChange,

    // Rest goes to the div
    children,
    ...rootDivProps
  } = props

  // Refs need to be created here and passed to Provider
  const rootRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)

  return (
    <VideoPlayerProvider
      actionsRef={actionsRef}
      defaultPlaying={defaultPlaying}
      defaultVolume={defaultVolume}
      defaultMuted={defaultMuted}
      defaultPlaybackRate={defaultPlaybackRate}
      playing={playing}
      onPlayingChange={onPlayingChange}
      volume={volume}
      onVolumeChange={onVolumeChange}
      muted={muted}
      onMutedChange={onMutedChange}
      playbackRate={playbackRate}
      onPlaybackRateChange={onPlaybackRateChange}
      currentTime={currentTime}
      onCurrentTimeChange={onCurrentTimeChange}
      idleTimeout={idleTimeout}
      preventIdleWhenPaused={preventIdleWhenPaused}
      idle={idle}
      onIdleChange={onIdleChange}
      onEnded={onEnded}
      onWaiting={onWaiting}
      onSeeking={onSeeking}
      onSeeked={onSeeked}
      onFullscreenChange={onFullscreenChange}
      onPictureInPictureChange={onPictureInPictureChange}
      rootRef={rootRef}
      videoRef={videoRef}
    >
      <VideoPlayerRootImpl
        ref={forwardedRef}
        rootRef={rootRef}
        keyboardShortcuts={keyboardShortcuts}
        hideCursorWhenIdle={hideCursorWhenIdle}
        {...rootDivProps}
      >
        {children}
      </VideoPlayerRootImpl>
    </VideoPlayerProvider>
  )
})

// ============================================================================
// Root Implementation (inside Provider, can use useVideoPlayer)
// ============================================================================

interface VideoPlayerRootImplProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> {
  rootRef: React.RefObject<HTMLDivElement | null>
  keyboardShortcuts: 'focused' | 'global' | 'none'
  hideCursorWhenIdle: 'always' | 'fullscreen' | false
  children: React.ReactNode
}

const VideoPlayerRootImpl = React.forwardRef<
  HTMLDivElement,
  VideoPlayerRootImplProps
>(function VideoPlayerRootImpl(
  {
    rootRef,
    keyboardShortcuts,
    hideCursorWhenIdle,
    children,
    className,
    style,
    ...divProps
  },
  forwardedRef,
) {
  const context = useVideoPlayer()
  const composedRef = useComposedRef(forwardedRef, rootRef)
  const lastMousePosition = React.useRef<{ x: number; y: number } | null>(null)

  // Keyboard shortcuts
  useKeyboardShortcuts(rootRef, keyboardShortcuts)

  // Mouse handlers for idle detection
  const handleMouseMove = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const { clientX, clientY } = event
      const last = lastMousePosition.current
      if (last && last.x === clientX && last.y === clientY) {
        return
      }
      lastMousePosition.current = { x: clientX, y: clientY }
      context.resetIdle()
    },
    [context],
  )

  const handleMouseEnter = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const { clientX, clientY } = event
      const last = lastMousePosition.current
      if (last && last.x === clientX && last.y === clientY) {
        return
      }
      lastMousePosition.current = { x: clientX, y: clientY }
      context.resetIdle()
    },
    [context],
  )

  const handleMouseLeave = React.useCallback(() => {
    context._handlers.onRootMouseLeave()
  }, [context._handlers])

  const handleClick = React.useCallback(() => {
    context.resetIdle()
  }, [context])

  const handleFocus = React.useCallback(() => {
    context.resetIdle()
  }, [context])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Tab') {
        context.resetIdle()
      }
    },
    [context],
  )

  const rootProps = mergeProps<'div'>(
    {
      onMouseMove: handleMouseMove,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onClick: handleClick,
      onFocus: handleFocus,
      onKeyDown: handleKeyDown,
    },
    divProps,
  )

  // Data attributes for styling
  const dataAttributes = {
    [RootDataAttributes.playing]: context.playing || undefined,
    [RootDataAttributes.paused]: context.paused || undefined,
    [RootDataAttributes.ended]: context.ended || undefined,
    [RootDataAttributes.waiting]: context.waiting || undefined,
    [RootDataAttributes.seeking]: context.seeking || undefined,
    [RootDataAttributes.fullscreen]: context.fullscreen || undefined,
    [RootDataAttributes.pip]: context.pictureInPicture || undefined,
    [RootDataAttributes.muted]: context.muted || undefined,
    [RootDataAttributes.idle]: context.idle || undefined,
  }

  // Determine if cursor should be hidden based on hideCursorWhenIdle prop
  const shouldHideCursor =
    hideCursorWhenIdle !== false &&
    context.idle &&
    (hideCursorWhenIdle === 'always' ||
      (hideCursorWhenIdle === 'fullscreen' && context.fullscreen))

  // Generate a stable ID for scoped CSS
  const scopeId = React.useId()

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: allowed
    <div
      {...rootProps}
      ref={composedRef}
      tabIndex={keyboardShortcuts === 'focused' ? 0 : undefined}
      className={className}
      style={style}
      data-video-player-scope={scopeId}
      {...dataAttributes}
    >
      {/* Inject scoped style to hide cursor - uses !important to override child styles */}
      {shouldHideCursor && (
        <style>{`[data-video-player-scope="${scopeId}"], [data-video-player-scope="${scopeId}"] * { cursor: none !important; }`}</style>
      )}
      {children}
    </div>
  )
})

// ============================================================================
// Namespace
// ============================================================================

export namespace VideoPlayerRoot {
  export type Props = VideoPlayerRootProps
  export type State = VideoPlayerRootState
}

// ============================================================================
// Utility: Compose Refs
// ============================================================================

function useComposedRef<T>(
  ...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
  return React.useCallback(
    (node: T) => {
      for (const ref of refs) {
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref != null) {
          ;(ref as React.RefObject<T>).current = node
        }
      }
    },
    // biome-ignore lint/correctness/useExhaustiveDependencies: allowed
    refs,
  )
}
