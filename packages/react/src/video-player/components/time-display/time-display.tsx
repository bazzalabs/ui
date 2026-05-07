'use client'

import * as React from 'react'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import type { RenderProp } from '../../types.js'
import { TimeDisplayDataAttributes } from './time-display.data-attributes.js'

// ============================================================================
// TimeDisplay Props
// ============================================================================

export type TimeDisplayFormat =
  | 'current'
  | 'duration'
  | 'remaining'
  | 'current / duration'
  | 'current / remaining'
  | 'hover'

export interface TimeDisplayProps extends React.ComponentPropsWithRef<'span'> {
  format?: TimeDisplayFormat
  /**
   * When true, reserves space for the maximum possible width based on
   * the duration format, preventing layout shift during playback/seeking.
   * @default true
   */
  fixedWidth?: boolean
  /**
   * Alignment of the text within the reserved space when fixedWidth is true.
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right'
  render?: RenderProp<TimeDisplayRenderProps, TimeDisplayState>
}

export interface TimeDisplayRenderProps {
  ref: React.Ref<HTMLElement>
  style: React.CSSProperties
  [TimeDisplayDataAttributes.hovering]?: boolean
}

export interface TimeDisplayState {
  currentTime: number
  duration: number
  remaining: number
  hoverTime: number | null
  hovering: boolean
  formattedCurrent: string
  formattedDuration: string
  formattedRemaining: string
  formattedHover: string | null
}

// ============================================================================
// TimeDisplay Component
// ============================================================================

export const TimeDisplay = React.forwardRef<HTMLSpanElement, TimeDisplayProps>(
  function TimeDisplay(props, forwardedRef) {
    const {
      format = 'current / duration',
      fixedWidth = true,
      align = 'left',
      render,
      ...spanProps
    } = props
    const context = useVideoPlayerContext('TimeDisplay')

    // Preserve last hover time for exit animations
    const lastHoverTimeRef = React.useRef<number>(0)
    if (context.hoverTime !== null) {
      lastHoverTimeRef.current = context.hoverTime
    }

    const remaining = context.duration - context.currentTime
    const formattedCurrent = formatTime(context.currentTime)
    const formattedDuration = formatTime(context.duration)
    const formattedRemaining = formatTime(remaining)
    const formattedHover =
      context.hoverTime !== null
        ? formatTime(context.hoverTime)
        : formatTime(lastHoverTimeRef.current)

    const state: TimeDisplayState = {
      currentTime: context.currentTime,
      duration: context.duration,
      remaining,
      hoverTime: context.hoverTime,
      hovering: context.hoverTime !== null,
      formattedCurrent,
      formattedDuration,
      formattedRemaining,
      formattedHover,
    }

    const getDisplayText = (): string => {
      switch (format) {
        case 'current':
          return formattedCurrent
        case 'duration':
          return formattedDuration
        case 'remaining':
          return `-${formattedRemaining}`
        case 'current / duration':
          return `${formattedCurrent} / ${formattedDuration}`
        case 'current / remaining':
          return `${formattedCurrent} / -${formattedRemaining}`
        case 'hover':
          return formattedHover
        default:
          return `${formattedCurrent} / ${formattedDuration}`
      }
    }

    // Generate template string for fixed width based on duration format
    const getTemplateText = (): string => {
      const timeTemplate = getTimeTemplate(context.duration)
      switch (format) {
        case 'current':
        case 'duration':
        case 'hover':
          return timeTemplate
        case 'remaining':
          return `-${timeTemplate}`
        case 'current / duration':
          return `${timeTemplate} / ${timeTemplate}`
        case 'current / remaining':
          return `${timeTemplate} / -${timeTemplate}`
        default:
          return `${timeTemplate} / ${timeTemplate}`
      }
    }

    const renderProps: TimeDisplayRenderProps = {
      ref: forwardedRef,
      style: {
        position: fixedWidth ? 'relative' : undefined,
        userSelect: 'none',
        fontVariantNumeric: 'tabular-nums',
        ...spanProps.style,
      },
      [TimeDisplayDataAttributes.hovering]: state.hovering || undefined,
    }

    if (render) {
      return render(renderProps, state)
    }

    return (
      <span
        ref={forwardedRef}
        {...{
          [TimeDisplayDataAttributes.hovering]: state.hovering || undefined,
        }}
        {...spanProps}
        style={{
          position: fixedWidth ? 'relative' : undefined,
          userSelect: 'none',
          fontVariantNumeric: 'tabular-nums',
          ...spanProps.style,
        }}
      >
        {fixedWidth ? (
          <>
            {/* Invisible template to reserve max width */}
            <span aria-hidden style={{ visibility: 'hidden' }}>
              {getTemplateText()}
            </span>
            {/* Actual content positioned over template */}
            <span style={getAlignmentStyle(align)}>{getDisplayText()}</span>
          </>
        ) : (
          getDisplayText()
        )}
      </span>
    )
  },
)

// ============================================================================
// Namespace
// ============================================================================

export namespace TimeDisplay {
  export type Props = TimeDisplayProps
  export type State = TimeDisplayState
  export type Format = TimeDisplayFormat
}

// ============================================================================
// Utility: Alignment Style
// ============================================================================

function getAlignmentStyle(
  align: 'left' | 'center' | 'right',
): React.CSSProperties {
  const base: React.CSSProperties = { position: 'absolute' }
  switch (align) {
    case 'left':
      return { ...base, left: 0 }
    case 'right':
      return { ...base, right: 0 }
    case 'center':
      return { ...base, left: '50%', transform: 'translateX(-50%)' }
  }
}

// ============================================================================
// Utility: Format Time
// ============================================================================

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || Number.isNaN(seconds)) return '0:00'

  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Generate a template string that represents the maximum width
 * for a given duration. Uses 0s which are typically the widest digit.
 */
function getTimeTemplate(duration: number): string {
  if (!Number.isFinite(duration) || Number.isNaN(duration) || duration <= 0) {
    return '0:00'
  }

  const hours = Math.floor(duration / 3600)
  const mins = Math.floor((duration % 3600) / 60)

  if (hours > 0) {
    // e.g., duration 1:23:45 → template "0:00:00"
    // e.g., duration 12:34:56 → template "00:00:00"
    const hourDigits = String(hours).length
    return `${'0'.repeat(hourDigits)}:00:00`
  }

  // e.g., duration 1:23 → template "0:00"
  // e.g., duration 12:34 → template "00:00"
  const minDigits = String(mins).length
  return `${'0'.repeat(minDigits)}:00`
}
