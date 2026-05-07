'use client'

import * as React from 'react'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import type { RenderProp } from '../../types.js'

// ============================================================================
// BufferedIndicator Props
// ============================================================================

export interface BufferedIndicatorProps
  extends React.ComponentPropsWithRef<'div'> {
  render?: RenderProp<BufferedIndicatorRenderProps, BufferedIndicatorState>
}

export interface BufferedIndicatorRenderProps {
  ref: React.Ref<HTMLElement>
  style: React.CSSProperties
  'aria-hidden': true
}

export interface BufferedIndicatorState {
  buffered: TimeRanges | null
  duration: number
  bufferedPercentage: number
  bufferedEnd: number
}

// ============================================================================
// BufferedIndicator Component
// ============================================================================

export const BufferedIndicator = React.forwardRef<
  HTMLDivElement,
  BufferedIndicatorProps
>(function BufferedIndicator(props, forwardedRef) {
  const { render, ...divProps } = props
  const context = useVideoPlayerContext('BufferedIndicator')

  // Calculate buffered end position (for progress bar display)
  const bufferedEnd = React.useMemo(() => {
    if (!context.buffered || context.buffered.length === 0) return 0

    // Find the buffer range that contains current playback position
    for (let i = 0; i < context.buffered.length; i++) {
      if (
        context.buffered.start(i) <= context.currentTime &&
        context.currentTime <= context.buffered.end(i)
      ) {
        return context.buffered.end(i)
      }
    }

    // Fallback to end of first range
    return context.buffered.end(0)
  }, [context.buffered, context.currentTime])

  const bufferedPercentage =
    context.duration > 0 ? (bufferedEnd / context.duration) * 100 : 0

  const state: BufferedIndicatorState = {
    buffered: context.buffered,
    duration: context.duration,
    bufferedPercentage,
    bufferedEnd,
  }

  // CSS custom properties for styling
  const style = {
    '--buffered-percentage': `${bufferedPercentage}%`,
    '--buffered-end': bufferedEnd,
    ...divProps.style,
  } as React.CSSProperties

  const renderProps: BufferedIndicatorRenderProps = {
    ref: forwardedRef,
    style,
    'aria-hidden': true,
  }

  if (render) {
    return render(renderProps, state)
  }

  return (
    <div ref={forwardedRef} aria-hidden="true" {...divProps} style={style} />
  )
})

// ============================================================================
// Namespace
// ============================================================================

export namespace BufferedIndicator {
  export type Props = BufferedIndicatorProps
  export type State = BufferedIndicatorState
}
