'use client'

import * as React from 'react'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import type { RenderProp } from '../../types.js'
import { CaptionsDataAttributes } from './captions.data-attributes.js'

// ============================================================================
// Captions Props
// ============================================================================

export interface CaptionsProps
  extends Omit<React.ComponentPropsWithRef<'div'>, 'children'> {
  /**
   * Custom render function for full control over caption rendering.
   * Receives renderProps (ref, aria attributes, data attributes) and state (cues, text).
   */
  render?: RenderProp<CaptionsRenderProps, CaptionsState>
  /**
   * Children to render instead of default cue text.
   * Use the render prop or useVideoPlayer() hook to access cue data.
   */
  children?: React.ReactNode
}

export interface CaptionsRenderProps {
  ref: React.Ref<HTMLDivElement>
  /** Announces caption changes to screen readers */
  'aria-live': 'polite'
  /** Ensures the full caption is read, not just changes */
  'aria-atomic': true
  /** Role for accessibility */
  role: 'status'
  /** Allow clicks to pass through to video */
  style: React.CSSProperties
  /** Applied when there are active cues */
  [CaptionsDataAttributes.active]?: boolean
}

export interface CaptionsState {
  /** Whether there are currently active cues */
  active: boolean
  /** Combined text from all active cues (joined with newlines) */
  cueText: string
  /** Raw VTTCue objects for advanced use cases */
  cues: VTTCue[]
}

// ============================================================================
// Captions Component
// ============================================================================

/**
 * Renders caption text with full styling control and accessibility support.
 * Uses aria-live="polite" to announce caption changes to screen readers.
 *
 * By default, renders the cue text directly. Use the render prop or children
 * for custom rendering.
 *
 * @example
 * // Default rendering with custom styles
 * <VideoPlayer.Captions
 *   className="absolute bottom-16 bg-black/80 text-white px-4 py-2 rounded"
 * />
 *
 * @example
 * // Custom rendering with render prop
 * <VideoPlayer.Captions
 *   render={(props, state) => (
 *     <div {...props} className="my-custom-captions">
 *       {state.cues.map((cue, i) => (
 *         <p key={i}>{cue.text}</p>
 *       ))}
 *     </div>
 *   )}
 * />
 */
export const Captions = React.forwardRef<HTMLDivElement, CaptionsProps>(
  function Captions(props, forwardedRef) {
    const { render, children, ...divProps } = props
    const context = useVideoPlayerContext('Captions')

    // Build state from context
    const cues = context.activeCues
    const cueText = cues.map((cue) => cue.text).join('\n')
    const active = cues.length > 0

    const state: CaptionsState = {
      active,
      cueText,
      cues,
    }

    const renderProps: CaptionsRenderProps = {
      ref: forwardedRef,
      'aria-live': 'polite',
      'aria-atomic': true,
      role: 'status',
      style: { pointerEvents: 'none' },
      [CaptionsDataAttributes.active]: active || undefined,
    }

    // Custom render function
    if (render) {
      return render(renderProps, state)
    }

    // Custom children (user controls content)
    if (children) {
      return (
        <div {...renderProps} {...divProps}>
          {children}
        </div>
      )
    }

    // Default rendering: show cue text
    return (
      <div {...renderProps} {...divProps}>
        {cueText}
      </div>
    )
  },
)

// ============================================================================
// Namespace
// ============================================================================

export namespace Captions {
  export type Props = CaptionsProps
  export type State = CaptionsState
  export type RenderProps = CaptionsRenderProps
}
