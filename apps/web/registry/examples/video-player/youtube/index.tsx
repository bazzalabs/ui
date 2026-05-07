'use client'

import { VideoPlayer } from '@bazza-ui/react/video-player'
import * as React from 'react'
import { cn } from '@/lib/cn'
import {
  CaptionsIcon,
  ExitFullscreenIcon,
  FullscreenIcon,
  PauseIcon,
  PictureInPictureIcon,
  PlayIcon,
  RestartIcon,
  SettingsIcon,
  SpinnerIcon,
  VolumeHighIcon,
  VolumeMutedIcon,
} from './icons'

export interface YouTubePlayerProps {
  src: string
  poster?: string
}

export function YouTubePlayer({ src, poster }: YouTubePlayerProps) {
  return (
    <VideoPlayer.Root
      preventIdleWhenPaused
      className={cn(
        '[--duration:200ms]',
        'group relative overflow-hidden bg-black',
        'aspect-video w-full max-w-full',
        '**:font-sans **:tabular-nums',
        // Fullscreen styles
        'data-[fullscreen]:flex data-[fullscreen]:items-center data-[fullscreen]:justify-center',
        'data-[fullscreen]:h-full data-[fullscreen]:w-full',
      )}
    >
      {/* Poster */}
      <VideoPlayer.Poster
        className={cn(
          'absolute inset-0 bg-black bg-cover bg-center',
          'transition-opacity duration-(--duration) ease-out',
          'data-[starting-style]:opacity-100 data-[ending-style]:opacity-0',
        )}
        style={poster ? { backgroundImage: `url(${poster})` } : undefined}
      />

      {/* Video */}
      <VideoPlayer.Video
        src={src}
        className={cn(
          'w-full h-full object-contain',
          'group-data-[fullscreen]:max-h-full group-data-[fullscreen]:max-w-full',
        )}
      />

      {/* Clickable overlay */}
      <VideoPlayer.Overlay
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          'opacity-100 scale-100',
          'transition-[opacity,scale] duration-(--duration) ease-out',
          'data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95',
        )}
      >
        {/* Center play/pause indicator - shows briefly on toggle */}
        <CenterPlayPauseIndicator />
      </VideoPlayer.Overlay>

      {/* Controls container */}
      <VideoPlayer.Controls
        className={cn(
          'absolute bottom-0 left-0 w-full flex flex-col',
          'opacity-100 transition-[opacity,translate] duration-(--duration) ease-out',
          'data-[starting-style]:opacity-0 data-[starting-style]:translate-y-full',
          'data-[ending-style]:opacity-0 data-[ending-style]:translate-y-full',
        )}
      >
        {/* Progress bar row */}
        <div className="px-3">
          <VideoPlayer.SeekSlider
            thumbAlignment="center"
            className={cn(
              'flex items-center w-full select-none touch-none cursor-pointer',
              'group/seek',
            )}
          >
            <VideoPlayer.SeekSliderControl className="flex items-center w-full h-5">
              <VideoPlayer.SeekSliderTrack
                className={cn(
                  'relative w-full',
                  'bg-black/50',
                  'h-1 group-hover/seek:h-1.5 group-data-[pressing]/seek:h-1.5',
                  'transition-[height] duration-100 ease-out rounded-sm',
                )}
              >
                <VideoPlayer.SeekSliderBuffered className="absolute h-full bg-white/50 rounded-sm" />
                <VideoPlayer.SeekSliderHover className="absolute h-full bg-white/50 rounded-sm" />
                <VideoPlayer.SeekSliderProgress className="absolute h-full bg-red-600 rounded-sm" />
                <VideoPlayer.SeekSliderThumb className="size-4 rounded-full bg-red-600 shadow-sm" />
              </VideoPlayer.SeekSliderTrack>
            </VideoPlayer.SeekSliderControl>

            {/* Hover preview thumb (anchor for tooltip) */}
            <VideoPlayer.SeekSliderPreviewThumb />

            {/* Tooltip with thumbnail and time display (collision-aware) */}
            <VideoPlayer.SeekSliderPreviewTooltip
              sideOffset={24}
              collisionPadding={12}
              className={cn('flex flex-col items-center gap-2')}
            >
              <VideoPlayer.Thumbnail
                width={160}
                className="rounded border-2 border-white shadow-lg"
              />
              <div
                className={cn(
                  'px-2 py-1 bg-black/50 rounded-xl text-xs text-white font-medium',
                  'whitespace-nowrap',
                )}
              >
                <VideoPlayer.TimeDisplay format="hover" align="center" />
              </div>
            </VideoPlayer.SeekSliderPreviewTooltip>
          </VideoPlayer.SeekSlider>
        </div>

        {/* Button row */}
        <div className="flex items-center gap-1 px-2 pb-2">
          {/* Left group */}
          <VideoPlayer.PlayButton className={cn(buttonClassName, 'group/play')}>
            <PlayIcon className="hidden group-data-[paused]/play:block group-data-[waiting]/play:block" />
            <PauseIcon className="hidden group-data-[playing]/play:block" />
            <RestartIcon className="hidden group-data-[ended]/play:block" />
          </VideoPlayer.PlayButton>

          {/* Volume control with expanding slider */}
          <div className="group/volume flex items-center">
            <VideoPlayer.MuteButton
              className={cn(buttonClassName, 'group/mute')}
            >
              <VolumeHighIcon className="hidden group-data-[volume-on]/mute:block" />
              <VolumeMutedIcon className="hidden group-data-[volume-off]/mute:block group-data-[muted]/mute:block" />
            </VideoPlayer.MuteButton>

            <div className="w-0 group-hover/volume:w-16 group-hover/volume:overflow-visible overflow-hidden transition-[width] duration-200 ease-out">
              <VideoPlayer.VolumeSlider
                className="flex items-center h-10 w-16"
                orientation="horizontal"
                thumbAlignment="edge"
              >
                <VideoPlayer.VolumeSliderControl className="w-full h-full flex items-center">
                  <VideoPlayer.VolumeSliderTrack className="relative h-1 w-full bg-white/30 rounded-full">
                    <VideoPlayer.VolumeSliderRange className="absolute h-full bg-white rounded-full" />
                    <VideoPlayer.VolumeSliderThumb className="block size-3 bg-white rounded-full shadow-sm" />
                  </VideoPlayer.VolumeSliderTrack>
                </VideoPlayer.VolumeSliderControl>
              </VideoPlayer.VolumeSlider>
            </div>
          </div>

          {/* Time display */}
          <div className="flex items-center text-white text-sm ml-2 select-none">
            <VideoPlayer.TimeDisplay
              format="current"
              className="tabular-nums"
            />
            <span className="mx-1 text-white/70">/</span>
            <VideoPlayer.TimeDisplay
              format="duration"
              className="tabular-nums text-white/70"
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right group */}
          <VideoPlayer.CaptionsButton
            className={cn(buttonClassName, 'group/captions')}
          >
            <CaptionsIcon className="opacity-70 group-data-[active]/captions:opacity-100" />
          </VideoPlayer.CaptionsButton>

          <VideoPlayer.PlaybackRateButton className={buttonClassName}>
            <SettingsIcon />
          </VideoPlayer.PlaybackRateButton>

          <VideoPlayer.PictureInPictureButton className={buttonClassName}>
            <PictureInPictureIcon />
          </VideoPlayer.PictureInPictureButton>

          <VideoPlayer.FullscreenButton
            className={cn(buttonClassName, 'group/fullscreen')}
          >
            <FullscreenIcon className="group-data-[fullscreen]/fullscreen:hidden" />
            <ExitFullscreenIcon className="hidden group-data-[fullscreen]/fullscreen:block" />
          </VideoPlayer.FullscreenButton>
        </div>
      </VideoPlayer.Controls>
    </VideoPlayer.Root>
  )
}

export default function VideoPlayerYouTubeExample() {
  return (
    <YouTubePlayer src="https://static.linear.app/assets/web/quality/teaser-full.90D8F66A-6715-41C0-9BC0-74FCD0B1047C.mp4" />
  )
}

// Center play/pause indicator that shows briefly on toggle
function CenterPlayPauseIndicator() {
  const { playing } = VideoPlayer.useVideoPlayer()
  const [visible, setVisible] = React.useState(false)
  const [icon, setIcon] = React.useState<'play' | 'pause'>('play')
  const prevPlayingRef = React.useRef(playing)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    // Detect play/pause toggle
    if (prevPlayingRef.current !== playing) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set the icon based on the new state
      setIcon(playing ? 'play' : 'pause')
      setVisible(true)

      // Hide after 1 second
      timeoutRef.current = setTimeout(() => {
        setVisible(false)
      }, 1000)

      prevPlayingRef.current = playing
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [playing])

  return (
    <div
      className={cn(
        'size-16 md:size-20 rounded-full flex items-center justify-center',
        'bg-black/60',
        'transition-opacity duration-200 ease-out',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
      )}
      aria-hidden="true"
    >
      {icon === 'play' ? (
        <PlayIcon className="size-8 md:size-10 fill-white ml-1" />
      ) : (
        <PauseIcon className="size-8 md:size-10 fill-white" />
      )}
    </div>
  )
}

// Button styles
const buttonClassName = cn(
  'size-10 flex items-center justify-center rounded-sm',
  'text-white hover:bg-white/10 transition-colors',
  '*:size-5 *:fill-current',
)
