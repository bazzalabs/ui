'use client'

import { Slider } from '@base-ui/react/slider'
import * as React from 'react'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import type { RenderProp } from '../../types.js'
import { VolumeSliderCssVars } from './volume-slider.css-vars.js'
import { VolumeSliderDataAttributes } from './volume-slider.data-attributes.js'

// ============================================================================
// VolumeSlider Props
// ============================================================================

export interface VolumeSliderProps
  extends Omit<
    React.ComponentPropsWithRef<typeof Slider.Root>,
    'value' | 'onValueChange' | 'min' | 'max' | 'step' | 'render'
  > {
  render?: RenderProp<VolumeSliderRenderProps, VolumeSliderState>
}

export interface VolumeSliderRenderProps {
  [VolumeSliderDataAttributes.muted]?: boolean
  [VolumeSliderDataAttributes.volume]: number
  [VolumeSliderDataAttributes.pressing]?: boolean
  [VolumeSliderDataAttributes.dragging]?: boolean
  style: React.CSSProperties
}

export interface VolumeSliderState {
  volume: number
  muted: boolean
  percentage: number
  pressing: boolean
  dragging: boolean
}

// ============================================================================
// VolumeSlider Component
// ============================================================================

export const VolumeSlider = React.forwardRef<
  React.ComponentRef<typeof Slider.Root>,
  VolumeSliderProps
>(function VolumeSlider(props, forwardedRef) {
  const { render, children, onPointerDown, ...sliderProps } = props
  const context = useVideoPlayerContext('VolumeSlider')
  const sliderRef = React.useRef<HTMLDivElement | null>(null)
  const [pressing, setPressing] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const pressingRef = React.useRef(false)

  React.useEffect(() => {
    if (!pressing) return

    const handleGlobalPointerUp = () => {
      setPressing(false)
      setDragging(false)
      pressingRef.current = false
    }

    window.addEventListener('pointerup', handleGlobalPointerUp)
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp)
  }, [pressing])

  // Sync internal ref with forwarded ref
  React.useLayoutEffect(() => {
    if (typeof forwardedRef === 'function') {
      forwardedRef(sliderRef.current)
    } else if (forwardedRef) {
      forwardedRef.current = sliderRef.current
    }
  })

  const percentage = context.volume * 100

  const state: VolumeSliderState = {
    volume: context.volume,
    muted: context.muted,
    percentage,
    pressing,
    dragging,
  }

  const handleValueChange = React.useCallback(
    (value: number | readonly number[]) => {
      const v = typeof value === 'number' ? value : value[0]
      if (v === undefined) return
      // If muted and user drags slider, unmute (without restoring previous volume)
      if (context.muted) {
        // Directly set muted to false on the video element and update state
        // by calling toggleMute would restore previous volume, so we need a different approach
        const video = context.videoRef.current
        if (video) {
          video.muted = false
        }
      }
      context.setVolume(v)
      context.resetIdle() // Keep player active while adjusting volume
      if (pressingRef.current) {
        setDragging(true)
      }
    },
    [context],
  )

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent) => {
      onPointerDown?.(event as any)
      setPressing(true)
      pressingRef.current = true
    },
    [onPointerDown],
  )

  // Data attributes
  const dataAttributes = {
    [VolumeSliderDataAttributes.muted]: context.muted || undefined,
    [VolumeSliderDataAttributes.volume]: context.volume,
    [VolumeSliderDataAttributes.pressing]: pressing || undefined,
    [VolumeSliderDataAttributes.dragging]: dragging || undefined,
  }

  // CSS custom properties for styling
  const style = {
    position: 'relative' as const,
    [VolumeSliderCssVars.volume]: context.volume,
    [VolumeSliderCssVars.volumePercentage]: `${percentage}%`,
    ...sliderProps.style,
  } as unknown as React.CSSProperties

  const renderProps: VolumeSliderRenderProps = {
    [VolumeSliderDataAttributes.muted]: context.muted || undefined,
    [VolumeSliderDataAttributes.volume]: context.volume,
    [VolumeSliderDataAttributes.pressing]: pressing || undefined,
    [VolumeSliderDataAttributes.dragging]: dragging || undefined,
    style,
  }

  // Render prop takes full control
  if (render) {
    return (
      <Slider.Root
        ref={sliderRef as React.RefObject<HTMLDivElement>}
        min={0}
        max={1}
        step={0.01}
        value={context.muted ? 0 : context.volume}
        onValueChange={handleValueChange}
        onPointerDown={handlePointerDown}
        aria-label="Volume"
        render={(baseProps) => render({ ...baseProps, ...renderProps }, state)}
      />
    )
  }

  // Composition pattern: if children provided, use them; otherwise use default structure
  return (
    <Slider.Root
      ref={sliderRef as React.RefObject<HTMLDivElement>}
      min={0}
      max={1}
      step={0.01}
      value={context.muted ? 0 : context.volume}
      onValueChange={handleValueChange}
      onPointerDown={handlePointerDown}
      aria-label="Volume"
      {...dataAttributes}
      {...sliderProps}
      style={style}
    >
      {children ?? (
        <Slider.Control>
          <Slider.Track>
            <Slider.Indicator />
            <Slider.Thumb />
          </Slider.Track>
        </Slider.Control>
      )}
    </Slider.Root>
  )
})

// ============================================================================
// Sub-components for custom composition
// ============================================================================

export const VolumeSliderControl = Slider.Control

// VolumeSliderTrack - applies position: relative by default
export interface VolumeSliderTrackProps
  extends React.ComponentPropsWithRef<typeof Slider.Track> {}

export const VolumeSliderTrack = React.forwardRef<
  React.ComponentRef<typeof Slider.Track>,
  VolumeSliderTrackProps
>(function VolumeSliderTrack(props, forwardedRef) {
  const { style, ...trackProps } = props

  const trackStyle: React.CSSProperties = {
    position: 'relative',
    ...style,
  }

  return <Slider.Track ref={forwardedRef} style={trackStyle} {...trackProps} />
})

// VolumeSliderRange - Base UI handles positioning internally
export interface VolumeSliderRangeProps
  extends React.ComponentPropsWithRef<typeof Slider.Indicator> {}

export const VolumeSliderRange = React.forwardRef<
  React.ComponentRef<typeof Slider.Indicator>,
  VolumeSliderRangeProps
>(function VolumeSliderRange(props, forwardedRef) {
  // Base UI handles all positioning internally (width for horizontal, height for vertical)
  return <Slider.Indicator ref={forwardedRef} {...props} />
})

// VolumeSliderThumb - Base UI handles positioning internally
export interface VolumeSliderThumbProps
  extends React.ComponentPropsWithRef<typeof Slider.Thumb> {}

export const VolumeSliderThumb = React.forwardRef<
  React.ComponentRef<typeof Slider.Thumb>,
  VolumeSliderThumbProps
>(function VolumeSliderThumb(props, forwardedRef) {
  // Base UI handles positioning internally (position, insetInlineStart, top, translate)
  return <Slider.Thumb ref={forwardedRef} {...props} />
})

// ============================================================================
// Namespace
// ============================================================================

export namespace VolumeSlider {
  export type Props = VolumeSliderProps
  export type State = VolumeSliderState
}
