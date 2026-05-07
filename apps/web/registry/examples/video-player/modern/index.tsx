'use client'

import { Popover, Tooltip } from '@base-ui/react'
import { VideoPlayer } from '@bazza-ui/react/video-player'
import * as React from 'react'
import { cn } from '@/lib/cn'
import {
  CaptionsOffIcon,
  CaptionsOnIcon,
  FullscreenIcon,
  MuteIcon,
  PauseIcon,
  PictureInPictureIcon,
  PlayIcon,
  ReplayIcon,
  SpinnerIcon,
  VolumeHighIcon,
  VolumeLowIcon,
} from './icons'

export interface VideoPlayerProps {
  src: string
  captions?: Array<{
    src: string
    label: string
    srcLang: string
    default?: boolean
  }>
}

export function ModernPlayer({ src, captions }: VideoPlayerProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  return (
    <VideoPlayer.Root
      ref={ref}
      hideCursorWhenIdle="always"
      preventIdleWhenPaused
      className={cn(
        '[--duration:300ms]',
        'group/root relative rounded-xl overflow-hidden bg-black',
        'flex items-center justify-center',
        'shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,0.5)]',
        'aspect-video w-full h-auto',
        'data-[fullscreen]:rounded-none data-[fullscreen]:h-full data-[fullscreen]:w-full',
        'data-[fullscreen]:border-0 data-[fullscreen]:shadow-none',
      )}
    >
      <VideoPlayer.Poster
        className={cn(
          'absolute inset-0 bg-zinc-900',
          'transition-opacity duration-(--duration) ease-out',
          'data-[starting-style]:opacity-100 data-[ending-style]:opacity-0',
        )}
      />
      <VideoPlayer.Video
        src={src}
        className={cn(
          'w-full h-auto',
          'group-data-[fullscreen]:w-full group-data-[fullscreen]:h-auto',
        )}
      >
        {captions?.map((track) => (
          <VideoPlayer.Track
            key={track.src}
            kind="captions"
            src={track.src}
            label={track.label}
            srcLang={track.srcLang}
            default={track.default}
          />
        ))}
      </VideoPlayer.Video>
      <VideoPlayer.Overlay className="absolute w-full h-full top-0 left-0 bg-black/30 data-[starting-style]:bg-transparent data-[ending-style]:bg-transparent transition-[background-color] duration-(--duration) ease-out" />
      <VideoPlayer.Captions
        className={cn(
          'absolute bottom-22 group-data-[idle]/root:bottom-8 left-1/2 -translate-x-1/2',
          'bg-black/50 text-white px-2 py-1 rounded-lg',
          'font-sans text-center max-w-[80%]',
          'group-data-[fullscreen]/root:text-3xl group-data-[fullscreen]/root:bottom-48 group-data-[fullscreen]/root:group-data-[idle]/root:bottom-32',
          'hidden data-[active]:block',
          'transition-[opacity,bottom] duration-200',
        )}
      />
      <Tooltip.Provider delay={0} closeDelay={0}>
        <VideoPlayer.Controls
          className={cn(
            'absolute bottom-2 left-1/2 -translate-x-1/2 h-fit w-[90%]',
            'flex items-center gap-4',
            'backdrop-blur-md bg-white/5 rounded-2xl px-4 border border-white/10 shadow-md',
            'opacity-100 translate-y-0 blur-none transition-[opacity,filter,translate] duration-(--duration) ease-out',
            'data-[starting-style]:opacity-0 data-[starting-style]:translate-y-2.5 data-[starting-style]:blur-xs',
            'data-[ending-style]:opacity-0 data-[ending-style]:translate-y-2.5 data-[ending-style]:blur-xs',
          )}
        >
          <Tooltip.Root>
            <Tooltip.Trigger
              render={
                <VideoPlayer.PlayButton
                  className={cn(buttonClassName, 'group *:size-4 *:text-white')}
                />
              }
            >
              <SpinnerIcon className="hidden group-data-[waiting]:block animate-spin" />
              <PlayIcon className="hidden group-data-[paused]:block" />
              <PauseIcon className="hidden group-data-[playing]:block" />
              <ReplayIcon className="hidden group-data-[ended]:block" />
            </Tooltip.Trigger>
            <Tooltip.Portal container={ref}>
              <Tooltip.Positioner
                side="top"
                sideOffset={8}
                positionMethod="fixed"
              >
                <Tooltip.Popup className={tooltipPopupClassName}>
                  Play/Pause
                  <Kbd>K</Kbd>
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>

          <div>
            <Popover.Root>
              <Popover.Trigger
                openOnHover
                delay={0}
                onClick={(e) => {
                  e.preventBaseUIHandler()
                }}
                render={(props) => (
                  <VideoPlayer.MuteButton
                    {...props}
                    className={cn(buttonClassName, 'group text-white')}
                  >
                    <MuteIcon className="hidden group-data-[volume-off]:block" />
                    <VolumeLowIcon className="hidden group-data-[volume-low]:block" />
                    <VolumeHighIcon className="hidden group-data-[volume-high]:block" />
                  </VideoPlayer.MuteButton>
                )}
              />
              <Popover.Portal container={ref}>
                <Popover.Positioner
                  className="z-50"
                  side="top"
                  align="center"
                  sideOffset={8}
                >
                  <Popover.Popup className="z-50 border border-white/10 bg-white/10 backdrop-blur-sm w-8 py-3 rounded-[10px]">
                    <VideoPlayer.VolumeSlider
                      className="flex flex-col items-center h-16 w-full **:cursor-crosshair! group"
                      orientation="vertical"
                      thumbAlignment="edge"
                    >
                      <VideoPlayer.VolumeSliderControl className="w-full h-full flex flex-col items-center">
                        <VideoPlayer.VolumeSliderTrack className="relative w-1 h-full bg-white/30 rounded-full group-data-[pressing]:w-1.5 transition-[width] duration-150 ease-in-out">
                          <VideoPlayer.VolumeSliderRange className="absolute bottom-0 w-full bg-white rounded-full" />
                          <VideoPlayer.VolumeSliderThumb className="block size-3 bg-white rounded-full shadow-sm" />
                        </VideoPlayer.VolumeSliderTrack>
                      </VideoPlayer.VolumeSliderControl>
                    </VideoPlayer.VolumeSlider>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>

          <VideoPlayer.TimeDisplay
            align="right"
            format="current"
            className="text-white text-xs"
          />
          <VideoPlayer.SeekSlider className="flex items-center w-full h-10 select-none touch-none group/seek cursor-crosshair! **:cursor-crosshair!">
            <VideoPlayer.SeekSliderControl className="flex items-center w-full h-full">
              <VideoPlayer.SeekSliderTrack className="relative h-1 w-full overflow-hidden rounded-[9999999px] bg-white/20 group-data-[pressing]/seek:h-1.5 transition-[height] duration-150 ease-in-out">
                <VideoPlayer.SeekSliderBuffered className="absolute h-full bg-white/30" />
                <VideoPlayer.SeekSliderProgress className="absolute h-full bg-white" />
                <VideoPlayer.SeekSliderThumb className="size-0" />
              </VideoPlayer.SeekSliderTrack>
            </VideoPlayer.SeekSliderControl>
            <VideoPlayer.SeekSliderPreviewThumb
              className={cn(
                'h-8 w-px shadow-md relative group/thumb',
                'group-data-[pressing]/seek:h-10',
                'transition-[height] duration-150 ease-in-out',
              )}
            >
              <div
                className={cn(
                  'absolute bottom-0 left-0 bg-white/50 w-px',
                  'group-data-[pressing]/seek:bg-white',
                  'opacity-100 h-full blur-none',
                  'transition-[height,opacity,filter] duration-150 ease-out',
                  'group-data-[starting-style]/thumb:opacity-0 group-data-[starting-style]/thumb:h-0 group-data-[starting-style]/thumb:blur-xs',
                  'group-data-[ending-style]/thumb:opacity-0 group-data-[ending-style]/thumb:h-0 group-data-[ending-style]/thumb:blur-xs',
                )}
              />
              <div
                key="thumb-time"
                className={cn(
                  'absolute bottom-full mb-2 left-1/2 -translate-x-1/2',
                  'flex items-center gap-1 text-[11px]',
                  'group-data-[pressing]/seek:text-sm',
                  'opacity-100 translate-y-0 blur-none',
                  'transition-[opacity,filter,translate,font-size] duration-150 ease-in-out',
                  'group-data-[starting-style]/thumb:opacity-0 group-data-[starting-style]/thumb:translate-y-2.5 group-data-[starting-style]/thumb:blur-xs',
                  'group-data-[ending-style]/thumb:opacity-0 group-data-[ending-style]/thumb:translate-y-2.5 group-data-[ending-style]/thumb:blur-xs',
                )}
              >
                <VideoPlayer.TimeDisplay
                  fixedWidth={false}
                  format="hover"
                  className="text-white"
                />
                <span className="text-white/50">/</span>
                <VideoPlayer.TimeDisplay
                  fixedWidth={false}
                  format="duration"
                  className="text-white/50"
                />
              </div>
            </VideoPlayer.SeekSliderPreviewThumb>
          </VideoPlayer.SeekSlider>
          <VideoPlayer.TimeDisplay
            align="left"
            format="duration"
            className="text-white text-xs"
          />

          <Tooltip.Root>
            <VideoPlayer.PlaybackRateButton
              render={(props, state) => (
                <Tooltip.Trigger
                  render={
                    <button
                      {...props}
                      className={cn(
                        buttonClassName,
                        'w-15 min-w-15 text-sm',
                        'text-white',
                      )}
                    />
                  }
                >
                  {state.playbackRate}x
                </Tooltip.Trigger>
              )}
            />
            <Tooltip.Portal container={ref}>
              <Tooltip.Positioner
                side="top"
                sideOffset={8}
                positionMethod="fixed"
              >
                <Tooltip.Popup className={tooltipPopupClassName}>
                  Playback speed
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger
              render={
                <VideoPlayer.CaptionsButton
                  className={cn(
                    buttonClassName,
                    'group opacity-50 data-[available]:opacity-75 data-[available]:hover:opacity-100',
                  )}
                />
              }
            >
              <CaptionsOnIcon className="text-white hidden group-data-[active]:block" />
              <CaptionsOffIcon className="text-white group-data-[active]:hidden" />
            </Tooltip.Trigger>
            <Tooltip.Portal container={ref}>
              <Tooltip.Positioner
                side="top"
                sideOffset={8}
                positionMethod="fixed"
              >
                <Tooltip.Popup className={tooltipPopupClassName}>
                  Captions
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger
              render={
                <VideoPlayer.PictureInPictureButton
                  className={cn(buttonClassName)}
                />
              }
            >
              <PictureInPictureIcon className="text-white" />
            </Tooltip.Trigger>
            <Tooltip.Portal container={ref}>
              <Tooltip.Positioner
                side="top"
                sideOffset={8}
                positionMethod="fixed"
              >
                <Tooltip.Popup className={tooltipPopupClassName}>
                  Mini player
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger
              render={
                <VideoPlayer.FullscreenButton
                  className={cn(buttonClassName, 'group')}
                />
              }
            >
              <FullscreenIcon className="text-white" />
            </Tooltip.Trigger>
            <Tooltip.Portal container={ref}>
              <Tooltip.Positioner
                side="top"
                sideOffset={8}
                positionMethod="fixed"
              >
                <Tooltip.Popup className={tooltipPopupClassName}>
                  Fullscreen
                  <Kbd>F</Kbd>
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </VideoPlayer.Controls>
      </Tooltip.Provider>
    </VideoPlayer.Root>
  )
}

export default function VideoPlayerModernExample() {
  return (
    <ModernPlayer
      src="https://static.linear.app/assets/web/quality/teaser-full.90D8F66A-6715-41C0-9BC0-74FCD0B1047C.mp4"
      captions={[
        {
          src: '/linear-quality-teaser.captions.vtt',
          label: 'English',
          srcLang: 'en',
          default: true,
        },
      ]}
    />
  )
}

const buttonClassName = cn(
  'size-8 min-h-8 min-w-8 flex items-center justify-center',
  'opacity-75 hover:opacity-100',
  'active:scale-95',
  'transition-[scale,opacity] duration-(--duration) ease-out',
)

const tooltipPopupClassName = cn(
  'bg-zinc-950 text-zinc-50 text-xs px-2 py-1 rounded-md',
  'flex items-center gap-1.5',
)

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="bg-white/20 text-[10px] px-1 py-0.5 rounded font-mono">
      {children}
    </kbd>
  )
}
