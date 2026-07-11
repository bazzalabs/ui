'use client'

import { Slider, type SliderRoot } from '@base-ui/react/slider'
import {
  autoUpdate,
  offset,
  type Padding,
  shift,
  useFloating,
} from '@floating-ui/react'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import { useTransitionStatus } from '../../hooks/use-transition-status.js'
import type { RenderProp } from '../../types.js'
import { SeekSliderCssVars } from './seek-slider.css-vars.js'
import { SeekSliderDataAttributes } from './seek-slider.data-attributes.js'
import { SeekSliderPreviewThumbDataAttributes } from './seek-slider-preview-thumb.data-attributes.js'

// ============================================================================
// SeekSlider Context (for sharing refs between SeekSlider children)
// ============================================================================

interface SeekSliderContextValue {
  sliderRef: React.RefObject<HTMLDivElement | null>
  previewThumbElement: HTMLElement | null
  setPreviewThumbElement: (element: HTMLElement | null) => void
  hoverProgress: number
  open: boolean
}

const SeekSliderContext = React.createContext<SeekSliderContextValue | null>(
  null,
)

function useSeekSliderContext(componentName: string) {
  const context = React.useContext(SeekSliderContext)
  if (!context) {
    throw new Error(`${componentName} must be used within SeekSlider`)
  }
  return context
}

function isKeyboardSeekKey(key: string) {
  return key === 'ArrowRight' || key === 'ArrowLeft'
}

// ============================================================================
// SeekSlider Props
// ============================================================================

export interface SeekSliderProps
  extends Omit<
    React.ComponentPropsWithRef<typeof Slider.Root>,
    'value' | 'onValueChange' | 'min' | 'max' | 'children' | 'render'
  > {
  render?: RenderProp<SeekSliderRenderProps, SeekSliderState>
  children?: React.ReactNode
}

export interface SeekSliderRenderProps {
  [SeekSliderDataAttributes.seeking]?: boolean
  [SeekSliderDataAttributes.hovering]?: boolean
  [SeekSliderDataAttributes.pressing]?: boolean
  [SeekSliderDataAttributes.dragging]?: boolean
  style: React.CSSProperties
}

export interface SeekSliderState {
  currentTime: number
  duration: number
  progress: number
  seeking: boolean
  pressing: boolean
  dragging: boolean
  hoverTime: number | null
  hoverProgress: number | null
}

// ============================================================================
// SeekSlider Component
// ============================================================================

export const SeekSlider = React.forwardRef<
  React.ComponentRef<typeof Slider.Root>,
  SeekSliderProps
>(function SeekSlider(props, forwardedRef) {
  const {
    render,
    children,
    onPointerMove,
    onPointerLeave,
    onPointerDown,
    onKeyUp,
    onValueCommitted,
    ...sliderProps
  } = props
  const context = useVideoPlayerContext('SeekSlider')
  const sliderRef = React.useRef<HTMLDivElement | null>(null)
  const [previewThumbElement, setPreviewThumbElement] =
    React.useState<HTMLElement | null>(null)
  const [pressing, setPressing] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const pressingRef = React.useRef(false)

  React.useEffect(() => {
    if (!pressing) return

    const handleGlobalPointerUp = () => {
      setPressing(false)
      setDragging(false)
      pressingRef.current = false
      context.endSeekInteraction()
    }

    window.addEventListener('pointerup', handleGlobalPointerUp)
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp)
  }, [pressing, context])

  const progress =
    context.duration > 0 ? (context.currentTime / context.duration) * 100 : 0

  const handleValueChange = React.useCallback(
    (
      value: number | readonly number[],
      eventDetails: SliderRoot.ChangeEventDetails,
    ) => {
      const v = typeof value === 'number' ? value : value[0]
      if (v === undefined) return

      if (eventDetails.reason === 'keyboard') {
        context.beginSeekInteraction()
      }

      context.seek(v)
      context.resetIdle()
      if (pressingRef.current) {
        setDragging(true)
      }
    },
    [context],
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent) => {
      onPointerMove?.(event as any)
      if (!sliderRef.current || context.duration === 0) return

      const rect = sliderRef.current.getBoundingClientRect()
      const x = event.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const time = percentage * context.duration

      context.setHoverTime(time)
    },
    [onPointerMove, context],
  )

  const handlePointerLeave = React.useCallback(
    (event: React.PointerEvent) => {
      onPointerLeave?.(event as any)
      context.setHoverTime(null)
    },
    [onPointerLeave, context],
  )

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent) => {
      onPointerDown?.(event as any)
      setPressing(true)
      pressingRef.current = true
      context.beginSeekInteraction()
    },
    [onPointerDown, context],
  )

  const handleKeyUp = React.useCallback(
    (event: React.KeyboardEvent) => {
      onKeyUp?.(event as any)
      if (isKeyboardSeekKey(event.key)) {
        context.endSeekInteraction()
      }
    },
    [onKeyUp, context],
  )

  const handleValueCommitted = React.useCallback(
    (
      value: number | readonly number[],
      eventDetails: SliderRoot.CommitEventDetails,
    ) => {
      const v = typeof value === 'number' ? value : value[0]
      if (v === undefined) return
      onValueCommitted?.(v, eventDetails)
      setPressing(false)
      setDragging(false)
      pressingRef.current = false
      if (
        eventDetails.reason === 'keyboard' &&
        isKeyboardSeekKey(eventDetails.event.key)
      ) {
        return
      }
      context.endSeekInteraction()
    },
    [onValueCommitted, context],
  )

  const bufferedEnd = React.useMemo(() => {
    if (!context.buffered || context.buffered.length === 0) return 0
    for (let i = 0; i < context.buffered.length; i++) {
      if (
        context.buffered.start(i) <= context.currentTime &&
        context.currentTime <= context.buffered.end(i)
      ) {
        return context.buffered.end(i)
      }
    }
    return context.buffered.end(0)
  }, [context.buffered, context.currentTime])

  const bufferedPercentage =
    context.duration > 0 ? (bufferedEnd / context.duration) * 100 : 0

  // Sync internal ref with forwarded ref
  React.useLayoutEffect(() => {
    if (typeof forwardedRef === 'function') {
      forwardedRef(sliderRef.current)
    } else if (forwardedRef) {
      forwardedRef.current = sliderRef.current
    }
  })

  const state: SeekSliderState = {
    currentTime: context.currentTime,
    duration: context.duration,
    progress,
    seeking: context.seeking,
    pressing,
    dragging,
    hoverTime: context.hoverTime,
    hoverProgress: context.hoverProgress,
  }

  // Context value for child components (PreviewThumb, Tooltip)
  const open = context.hoverProgress !== null
  const hoverProgress = context.hoverProgress ?? 0
  // biome-ignore lint/correctness/useExhaustiveDependencies: allowed
  const seekSliderContextValue = React.useMemo<SeekSliderContextValue>(
    () => ({
      sliderRef,
      previewThumbElement,
      setPreviewThumbElement,
      hoverProgress,
      open,
    }),
    [
      sliderRef,
      previewThumbElement,
      setPreviewThumbElement,
      hoverProgress,
      open,
    ],
  )

  const style = {
    position: 'relative',
    [SeekSliderCssVars.progress]: `${progress}%`,
    [SeekSliderCssVars.buffered]: `${bufferedPercentage}%`,
    [SeekSliderCssVars.currentTime]: context.currentTime,
    [SeekSliderCssVars.duration]: context.duration,
    [SeekSliderCssVars.hoverProgress]:
      context.hoverProgress !== null ? `${context.hoverProgress}%` : undefined,
    [SeekSliderCssVars.hoverTime]: context.hoverTime ?? undefined,
    ...sliderProps.style,
  } as unknown as React.CSSProperties

  const renderProps: SeekSliderRenderProps = {
    [SeekSliderDataAttributes.seeking]: context.seeking || undefined,
    [SeekSliderDataAttributes.hovering]:
      context.hoverTime !== null || undefined,
    [SeekSliderDataAttributes.pressing]: pressing || undefined,
    [SeekSliderDataAttributes.dragging]: dragging || undefined,
    style,
  }

  // Render prop: use Base UI's render prop to customize the root element
  if (render) {
    return (
      <SeekSliderContext.Provider value={seekSliderContextValue}>
        <Slider.Root
          ref={sliderRef}
          min={0}
          max={context.duration || 100}
          step={0.1}
          value={context.currentTime}
          onValueChange={handleValueChange}
          onValueCommitted={handleValueCommitted}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onPointerDown={handlePointerDown}
          onKeyUp={handleKeyUp}
          aria-label="Seek"
          render={(baseProps) =>
            render(
              {
                ...baseProps,
                ...renderProps,
                style: { ...baseProps.style, ...renderProps.style },
              },
              state,
            )
          }
        />
      </SeekSliderContext.Provider>
    )
  }

  return (
    <SeekSliderContext.Provider value={seekSliderContextValue}>
      <Slider.Root
        ref={sliderRef}
        min={0}
        max={context.duration || 100}
        step={0.1}
        value={context.currentTime}
        onValueChange={handleValueChange}
        onValueCommitted={handleValueCommitted}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onKeyUp={handleKeyUp}
        aria-label="Seek"
        {...renderProps}
        {...sliderProps}
      >
        {children ?? (
          <Slider.Control>
            <Slider.Track style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${bufferedPercentage}%`,
                }}
              />
              <Slider.Indicator />
              <Slider.Thumb />
            </Slider.Track>
          </Slider.Control>
        )}
      </Slider.Root>
    </SeekSliderContext.Provider>
  )
})

// ============================================================================
// Sub-components
// ============================================================================

// SeekSliderControl - wrapper for Slider.Control
export const SeekSliderControl = Slider.Control

// SeekSliderTrack
export interface SeekSliderTrackProps
  extends Omit<
    React.ComponentPropsWithRef<typeof Slider.Track>,
    'render' | 'children'
  > {
  render?: RenderProp<SeekSliderTrackRenderProps, SeekSliderTrackState>
  children?: React.ReactNode
}

export interface SeekSliderTrackRenderProps {
  ref: React.Ref<any>
  style: React.CSSProperties
}

export type SeekSliderTrackState = Record<string, never>

export const SeekSliderTrack = React.forwardRef<
  React.ComponentRef<typeof Slider.Track>,
  SeekSliderTrackProps
>(function SeekSliderTrack(props, forwardedRef) {
  const { render, children, style, ...trackProps } = props

  const state: SeekSliderTrackState = {}

  // Always apply position: relative so children with position: absolute work correctly
  const trackStyle: React.CSSProperties = {
    position: 'relative',
    ...style,
  }

  const renderProps: SeekSliderTrackRenderProps = {
    ref: forwardedRef,
    style: trackStyle,
  }

  if (render) {
    return (
      <Slider.Track
        render={(baseProps) => render({ ...baseProps, ...renderProps }, state)}
      />
    )
  }

  return (
    <Slider.Track ref={forwardedRef} style={trackStyle} {...trackProps}>
      {children}
    </Slider.Track>
  )
})

// SeekSliderProgress
export interface SeekSliderProgressProps
  extends Omit<
    React.ComponentPropsWithRef<typeof Slider.Indicator>,
    'render' | 'children'
  > {
  render?: RenderProp<SeekSliderProgressRenderProps, SeekSliderProgressState>
  children?: React.ReactNode
}

export interface SeekSliderProgressRenderProps {
  ref: React.Ref<any>
  style: React.CSSProperties
}

export interface SeekSliderProgressState {
  progress: number
}

export const SeekSliderProgress = React.forwardRef<
  React.ComponentRef<typeof Slider.Indicator>,
  SeekSliderProgressProps
>(function SeekSliderProgress(props, forwardedRef) {
  const { render, children, style, ...indicatorProps } = props
  const context = useVideoPlayerContext('SeekSliderProgress')

  const progress =
    context.duration > 0 ? (context.currentTime / context.duration) * 100 : 0

  const state: SeekSliderProgressState = { progress }

  // Base UI handles positioning internally via inline styles
  // We only add height: 100% to ensure it fills the track vertically
  const indicatorStyle: React.CSSProperties = {
    height: '100%',
    ...style,
  }

  const renderProps: SeekSliderProgressRenderProps = {
    ref: forwardedRef,
    style: indicatorStyle,
  }

  if (render) {
    return (
      <Slider.Indicator
        render={(baseProps) =>
          render(
            {
              ...baseProps,
              ...renderProps,
              style: { ...baseProps.style, ...indicatorStyle },
            },
            state,
          )
        }
      />
    )
  }

  return (
    <Slider.Indicator
      ref={forwardedRef}
      style={indicatorStyle}
      {...indicatorProps}
    >
      {children}
    </Slider.Indicator>
  )
})

// SeekSliderThumb
export interface SeekSliderThumbProps
  extends Omit<
    React.ComponentPropsWithRef<typeof Slider.Thumb>,
    'render' | 'children' | 'style'
  > {
  render?: RenderProp<SeekSliderThumbRenderProps, SeekSliderThumbState>
  children?: React.ReactNode
  style?: React.CSSProperties
}

export interface SeekSliderThumbRenderProps {
  ref: React.Ref<any>
  style: React.CSSProperties
}

export type SeekSliderThumbState = Record<string, never>

export const SeekSliderThumb = React.forwardRef<
  React.ComponentRef<typeof Slider.Thumb>,
  SeekSliderThumbProps
>(function SeekSliderThumb(props, forwardedRef) {
  const { render, children, style, ...thumbProps } = props

  const state: SeekSliderThumbState = {}

  // Base UI handles positioning internally (position, insetInlineStart, top, translate)
  // We just pass through user styles
  const renderProps: SeekSliderThumbRenderProps = {
    ref: forwardedRef,
    style: style ?? {},
  }

  if (render) {
    return (
      <Slider.Thumb
        render={(baseProps) =>
          render(
            {
              ...baseProps,
              ...renderProps,
              style: { ...baseProps.style, ...style },
            },
            state,
          )
        }
      />
    )
  }

  return (
    <Slider.Thumb ref={forwardedRef} style={style} {...thumbProps}>
      {children}
    </Slider.Thumb>
  )
})

// SeekSliderBuffered
export interface SeekSliderBufferedProps
  extends Omit<React.ComponentPropsWithRef<'div'>, 'children'> {
  render?: RenderProp<SeekSliderBufferedRenderProps, SeekSliderBufferedState>
  children?: React.ReactNode
}

export interface SeekSliderBufferedRenderProps {
  ref: React.Ref<HTMLDivElement>
  style: React.CSSProperties
}

export interface SeekSliderBufferedState {
  bufferedPercentage: number
}

export const SeekSliderBuffered = React.forwardRef<
  HTMLDivElement,
  SeekSliderBufferedProps
>(function SeekSliderBuffered(props, forwardedRef) {
  const { render, children, ...divProps } = props
  const context = useVideoPlayerContext('SeekSliderBuffered')

  const bufferedEnd = React.useMemo(() => {
    if (!context.buffered || context.buffered.length === 0) return 0
    for (let i = 0; i < context.buffered.length; i++) {
      if (
        context.buffered.start(i) <= context.currentTime &&
        context.currentTime <= context.buffered.end(i)
      ) {
        return context.buffered.end(i)
      }
    }
    return context.buffered.end(0)
  }, [context.buffered, context.currentTime])

  const bufferedPercentage =
    context.duration > 0 ? (bufferedEnd / context.duration) * 100 : 0

  const state: SeekSliderBufferedState = { bufferedPercentage }

  const style: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: `${bufferedPercentage}%`,
    ...divProps.style,
  }

  const renderProps: SeekSliderBufferedRenderProps = {
    ref: forwardedRef,
    style,
  }

  if (render) {
    return render(renderProps, state)
  }

  return (
    <div {...renderProps} {...divProps}>
      {children}
    </div>
  )
})

// SeekSliderPreviewThumb
export interface SeekSliderPreviewThumbProps
  extends Omit<React.ComponentPropsWithRef<'span'>, 'children'> {
  keepMounted?: boolean
  render?: RenderProp<
    SeekSliderPreviewThumbRenderProps,
    SeekSliderPreviewThumbState
  >
  children?: React.ReactNode
}

export interface SeekSliderPreviewThumbRenderProps {
  ref: React.Ref<any>
  style: React.CSSProperties
  [SeekSliderPreviewThumbDataAttributes.open]?: boolean
  [SeekSliderPreviewThumbDataAttributes.closed]?: boolean
  [SeekSliderPreviewThumbDataAttributes.startingStyle]?: boolean
  [SeekSliderPreviewThumbDataAttributes.endingStyle]?: boolean
}

export interface SeekSliderPreviewThumbState {
  open: boolean
  transitionStatus: 'starting' | 'ending' | undefined
  hoverProgress: number
}

export const SeekSliderPreviewThumb = React.forwardRef<
  HTMLSpanElement,
  SeekSliderPreviewThumbProps
>(function SeekSliderPreviewThumb(props, forwardedRef) {
  const { keepMounted = false, render, children, ...spanProps } = props
  const context = useVideoPlayerContext('SeekSliderPreviewThumb')
  const seekSliderContext = useSeekSliderContext('SeekSliderPreviewThumb')

  const open = context.hoverProgress !== null

  const lastProgressRef = React.useRef<number>(0)
  if (context.hoverProgress !== null) {
    lastProgressRef.current = context.hoverProgress
  }

  const hoverProgress = context.hoverProgress ?? lastProgressRef.current

  const { mounted, transitionStatus, elementRef } = useTransitionStatus({
    open,
    keepMounted,
  })

  const composedRef = React.useCallback(
    (node: HTMLSpanElement | null) => {
      ;(elementRef as React.MutableRefObject<HTMLElement | null>).current = node
      // Register with SeekSlider context for Tooltip to use as anchor
      seekSliderContext.setPreviewThumbElement(node)
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }
    },
    [forwardedRef, elementRef, seekSliderContext],
  )

  const state: SeekSliderPreviewThumbState = {
    open,
    transitionStatus,
    hoverProgress,
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${hoverProgress}%`,
    transform: 'translateX(-50%)',
    pointerEvents: 'none',
    ...spanProps.style,
  }

  const renderProps: SeekSliderPreviewThumbRenderProps = {
    ref: composedRef,
    style,
    [SeekSliderPreviewThumbDataAttributes.open]: open || undefined,
    [SeekSliderPreviewThumbDataAttributes.closed]: !open || undefined,
    [SeekSliderPreviewThumbDataAttributes.startingStyle]:
      transitionStatus === 'starting' || undefined,
    [SeekSliderPreviewThumbDataAttributes.endingStyle]:
      transitionStatus === 'ending' || undefined,
  }

  if (!mounted) {
    return null
  }

  if (render) {
    return render(renderProps, state)
  }

  return (
    <span {...renderProps} {...spanProps}>
      {children}
    </span>
  )
})

// SeekSliderHover
export interface SeekSliderHoverProps
  extends Omit<React.ComponentPropsWithRef<'div'>, 'children'> {
  render?: RenderProp<SeekSliderHoverRenderProps, SeekSliderHoverState>
  children?: React.ReactNode
}

export interface SeekSliderHoverRenderProps {
  ref: React.Ref<HTMLDivElement>
  style: React.CSSProperties
  'data-hovering'?: boolean
}

export interface SeekSliderHoverState {
  hovering: boolean
  hoverProgress: number | null
  hoverTime: number | null
}

export const SeekSliderHover = React.forwardRef<
  HTMLDivElement,
  SeekSliderHoverProps
>(function SeekSliderHover(props, forwardedRef) {
  const { render, children, style: styleProp, ...divProps } = props
  const context = useVideoPlayerContext('SeekSliderHover')

  const hovering = context.hoverProgress !== null
  const hoverProgress = context.hoverProgress ?? 0

  const state: SeekSliderHoverState = {
    hovering,
    hoverProgress: context.hoverProgress,
    hoverTime: context.hoverTime,
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: `${hoverProgress}%`,
    pointerEvents: 'none',
    ...styleProp,
  }

  const renderProps: SeekSliderHoverRenderProps = {
    ref: forwardedRef,
    style,
    'data-hovering': hovering || undefined,
  }

  if (render) {
    return render(renderProps, state)
  }

  return (
    <div {...renderProps} {...divProps}>
      {children}
    </div>
  )
})

// ============================================================================
// SeekSliderPreviewTooltip Components
// ============================================================================

// Portal - renders content in a portal (defaults to VideoPlayer root for correct stacking context)
export interface SeekSliderPreviewTooltipPortalProps {
  children: React.ReactNode
  /** Portal container. Defaults to the VideoPlayer root element. */
  container?: Element | null
}

export function SeekSliderPreviewTooltipPortal({
  children,
  container,
}: SeekSliderPreviewTooltipPortalProps) {
  const videoPlayerContext = useVideoPlayerContext(
    'SeekSliderPreviewTooltipPortal',
  )
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Default to VideoPlayer root for correct stacking context (z-index works within the player)
  const portalContainer =
    container ?? videoPlayerContext.rootRef.current ?? document.body
  return ReactDOM.createPortal(children, portalContainer)
}

// Positioner - handles Floating UI positioning
export interface SeekSliderPreviewTooltipPositionerProps
  extends React.ComponentPropsWithRef<'div'> {
  /** Offset from the anchor (thumb) in pixels (default: 8) */
  sideOffset?: number
  /** Padding from collision boundary edges (default: 0) */
  collisionPadding?: Padding
  /** Custom collision boundary element(s) */
  collisionBoundary?: Element | Element[]
  /** Keep mounted in DOM even when closed (default: false) */
  keepMounted?: boolean
  children?: React.ReactNode
}

export const SeekSliderPreviewTooltipPositioner = React.forwardRef<
  HTMLDivElement,
  SeekSliderPreviewTooltipPositionerProps
>(function SeekSliderPreviewTooltipPositioner(props, forwardedRef) {
  const {
    sideOffset = 8,
    collisionPadding = 0,
    collisionBoundary,
    keepMounted = false,
    children,
    style: styleProp,
    ...divProps
  } = props

  const seekSliderContext = useSeekSliderContext(
    'SeekSliderPreviewTooltipPositioner',
  )
  const { previewThumbElement, open, hoverProgress } = seekSliderContext
  const [floatingElement, setFloatingElement] =
    React.useState<HTMLDivElement | null>(null)

  const { refs, floatingStyles, update } = useFloating({
    placement: 'top',
    middleware: [
      offset(sideOffset),
      shift({
        boundary: collisionBoundary,
        padding: collisionPadding,
      }),
    ],
  })

  // Set reference element when it becomes available (following Base UI pattern)
  React.useLayoutEffect(() => {
    if (previewThumbElement) {
      refs.setReference(previewThumbElement)
    }
  }, [previewThumbElement, refs])

  // Set up autoUpdate when both elements are available
  React.useEffect(() => {
    if (open && previewThumbElement && floatingElement) {
      return autoUpdate(previewThumbElement, floatingElement, update)
    }
  }, [open, previewThumbElement, floatingElement, update])

  // Update position when hover progress changes (PreviewThumb moves via CSS)
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  React.useLayoutEffect(() => {
    if (open && previewThumbElement && floatingElement) {
      update()
    }
  }, [hoverProgress, open, previewThumbElement, floatingElement, update])

  // Merge refs - track floating element with state for effect dependencies
  const mergedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      refs.setFloating(node)
      setFloatingElement(node)
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }
    },
    [refs, forwardedRef],
  )

  // Don't render until we have the reference element (and open, unless keepMounted)
  const shouldRender = keepMounted
    ? !!previewThumbElement
    : open && !!previewThumbElement
  if (!shouldRender) return null

  return (
    <div
      ref={mergedRef}
      style={{ ...floatingStyles, ...styleProp }}
      data-seek-slider-preview-tooltip-positioner
      data-open={open || undefined}
      data-closed={!open || undefined}
      {...divProps}
    >
      {children}
    </div>
  )
})

// Popup - simple content wrapper
export interface SeekSliderPreviewTooltipPopupProps
  extends React.ComponentPropsWithRef<'div'> {
  children?: React.ReactNode
}

export const SeekSliderPreviewTooltipPopup = React.forwardRef<
  HTMLDivElement,
  SeekSliderPreviewTooltipPopupProps
>(function SeekSliderPreviewTooltipPopup(props, forwardedRef) {
  const { children, ...divProps } = props

  return (
    <div
      ref={forwardedRef}
      data-seek-slider-preview-tooltip-popup
      {...divProps}
    >
      {children}
    </div>
  )
})

// Simplified combined component
export interface SeekSliderPreviewTooltipProps
  extends Omit<SeekSliderPreviewTooltipPopupProps, 'ref'> {
  /** Offset from the anchor (thumb) in pixels (default: 8) */
  sideOffset?: number
  /** Padding from collision boundary edges (default: 0) */
  collisionPadding?: Padding
  /** Custom collision boundary element(s) */
  collisionBoundary?: Element | Element[]
  /** Keep mounted in DOM even when closed (default: false) */
  keepMounted?: boolean
  /** Portal container element */
  container?: Element | null
}

export function SeekSliderPreviewTooltip({
  sideOffset,
  collisionPadding,
  collisionBoundary,
  keepMounted,
  container,
  children,
  ...popupProps
}: SeekSliderPreviewTooltipProps) {
  return (
    <SeekSliderPreviewTooltipPortal container={container}>
      <SeekSliderPreviewTooltipPositioner
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        collisionBoundary={collisionBoundary}
        keepMounted={keepMounted}
      >
        <SeekSliderPreviewTooltipPopup {...popupProps}>
          {children}
        </SeekSliderPreviewTooltipPopup>
      </SeekSliderPreviewTooltipPositioner>
    </SeekSliderPreviewTooltipPortal>
  )
}

// Attach sub-components for composition pattern
SeekSliderPreviewTooltip.Portal = SeekSliderPreviewTooltipPortal
SeekSliderPreviewTooltip.Positioner = SeekSliderPreviewTooltipPositioner
SeekSliderPreviewTooltip.Popup = SeekSliderPreviewTooltipPopup

// ============================================================================
// Namespaces
// ============================================================================

export namespace SeekSlider {
  export type Props = SeekSliderProps
  export type State = SeekSliderState
  export type RenderProps = SeekSliderRenderProps
}

export namespace SeekSliderTrack {
  export type Props = SeekSliderTrackProps
  export type State = SeekSliderTrackState
  export type RenderProps = SeekSliderTrackRenderProps
}

export namespace SeekSliderProgress {
  export type Props = SeekSliderProgressProps
  export type State = SeekSliderProgressState
  export type RenderProps = SeekSliderProgressRenderProps
}

export namespace SeekSliderThumb {
  export type Props = SeekSliderThumbProps
  export type State = SeekSliderThumbState
  export type RenderProps = SeekSliderThumbRenderProps
}

export namespace SeekSliderBuffered {
  export type Props = SeekSliderBufferedProps
  export type State = SeekSliderBufferedState
  export type RenderProps = SeekSliderBufferedRenderProps
}

export namespace SeekSliderPreviewThumb {
  export type Props = SeekSliderPreviewThumbProps
  export type State = SeekSliderPreviewThumbState
  export type RenderProps = SeekSliderPreviewThumbRenderProps
}

export namespace SeekSliderHover {
  export type Props = SeekSliderHoverProps
  export type State = SeekSliderHoverState
  export type RenderProps = SeekSliderHoverRenderProps
}

export namespace SeekSliderPreviewTooltip {
  export type Props = SeekSliderPreviewTooltipProps
  export type PortalProps = SeekSliderPreviewTooltipPortalProps
  export type PositionerProps = SeekSliderPreviewTooltipPositionerProps
  export type PopupProps = SeekSliderPreviewTooltipPopupProps
}
