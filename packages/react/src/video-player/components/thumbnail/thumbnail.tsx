'use client'

import * as React from 'react'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import type { RenderProp } from '../../types.js'
import { ThumbnailDataAttributes } from './thumbnail.data-attributes.js'

// ============================================================================
// Thumbnail Props
// ============================================================================

export interface ThumbnailProps
  extends Omit<React.ComponentPropsWithRef<'canvas'>, 'children'> {
  /**
   * The time in seconds to capture the thumbnail from.
   * If not provided, uses the current hoverTime from context.
   */
  time?: number | null
  /**
   * Crossorigin attribute for the hidden video element.
   * Should match the main video's crossOrigin attribute.
   * @default 'anonymous'
   */
  crossOrigin?: '' | 'anonymous' | 'use-credentials'
  /**
   * Render prop for custom rendering.
   */
  render?: RenderProp<ThumbnailRenderProps, ThumbnailState>
  children?: React.ReactNode
}

export interface ThumbnailRenderProps {
  ref: React.Ref<HTMLCanvasElement>
  width: number
  height: number
  [ThumbnailDataAttributes.loading]?: boolean
  [ThumbnailDataAttributes.ready]?: boolean
  [ThumbnailDataAttributes.error]?: boolean
}

export interface ThumbnailState {
  loading: boolean
  ready: boolean
  error: boolean
  time: number | null
  /** Natural width of the video */
  videoWidth: number
  /** Natural height of the video */
  videoHeight: number
}

// ============================================================================
// Thumbnail Component
// ============================================================================

export const Thumbnail = React.forwardRef<HTMLCanvasElement, ThumbnailProps>(
  function Thumbnail(props, forwardedRef) {
    const {
      time: timeProp,
      crossOrigin = 'anonymous',
      render,
      children,
      width: widthProp,
      height: heightProp,
      ...canvasProps
    } = props

    const context = useVideoPlayerContext('Thumbnail')
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const videoRef = React.useRef<HTMLVideoElement | null>(null)
    const lastDrawnTimeRef = React.useRef<number | null>(null)

    const [status, setStatus] = React.useState<
      'idle' | 'loading' | 'ready' | 'error'
    >('idle')
    const [videoDimensions, setVideoDimensions] = React.useState({
      width: 160,
      height: 90,
    })

    // Use prop time or hoverTime from context
    const time = timeProp !== undefined ? timeProp : context.hoverTime

    // Get the video source from the main video element
    const videoSrc = React.useMemo(() => {
      const mainVideo = context.videoRef.current
      if (!mainVideo) return null
      return mainVideo.currentSrc || mainVideo.src
    }, [context.videoRef])

    // Create and manage the hidden video element
    React.useEffect(() => {
      if (!videoSrc) return

      const video = document.createElement('video')
      video.src = videoSrc
      video.crossOrigin = crossOrigin
      video.preload = 'metadata'
      video.muted = true
      video.playsInline = true

      const handleLoadedMetadata = () => {
        setVideoDimensions({
          width: video.videoWidth,
          height: video.videoHeight,
        })
      }

      const handleError = () => {
        setStatus('error')
      }

      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      video.addEventListener('error', handleError)

      videoRef.current = video

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('error', handleError)
        video.src = ''
        videoRef.current = null
      }
    }, [videoSrc, crossOrigin])

    // Seek and capture frame when time changes
    React.useEffect(() => {
      const video = videoRef.current
      const canvas = canvasRef.current

      if (!video || !canvas || time === null || time === undefined) {
        return
      }

      // Skip if we already drew this time (with small tolerance)
      if (
        lastDrawnTimeRef.current !== null &&
        Math.abs(lastDrawnTimeRef.current - time) < 0.1
      ) {
        return
      }

      setStatus('loading')

      const handleSeeked = () => {
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          lastDrawnTimeRef.current = time
          setStatus('ready')
        } catch {
          setStatus('error')
        }
      }

      video.addEventListener('seeked', handleSeeked, { once: true })
      video.currentTime = time

      return () => {
        video.removeEventListener('seeked', handleSeeked)
      }
    }, [time])

    // Compose refs
    const composedRef = React.useCallback(
      (node: HTMLCanvasElement | null) => {
        ;(canvasRef as React.RefObject<HTMLCanvasElement | null>).current = node
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
      },
      [forwardedRef],
    )

    // Calculate dimensions - use props or derive from video aspect ratio
    const aspectRatio = videoDimensions.width / videoDimensions.height
    let width = widthProp ?? 160
    let height = heightProp ?? Math.round((width as number) / aspectRatio)

    if (typeof width === 'string') width = 160
    if (typeof height === 'string') height = 90

    const state: ThumbnailState = {
      loading: status === 'loading',
      ready: status === 'ready',
      error: status === 'error',
      time,
      videoWidth: videoDimensions.width,
      videoHeight: videoDimensions.height,
    }

    const renderProps: ThumbnailRenderProps = {
      ref: composedRef,
      width,
      height,
      [ThumbnailDataAttributes.loading]: status === 'loading' || undefined,
      [ThumbnailDataAttributes.ready]: status === 'ready' || undefined,
      [ThumbnailDataAttributes.error]: status === 'error' || undefined,
    }

    if (render) {
      return render(renderProps, state)
    }

    return (
      <canvas {...renderProps} {...canvasProps}>
        {children}
      </canvas>
    )
  },
)

// ============================================================================
// Namespace
// ============================================================================

export namespace Thumbnail {
  export type Props = ThumbnailProps
  export type State = ThumbnailState
  export type RenderProps = ThumbnailRenderProps
}
