'use client'

import * as React from 'react'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import type { RenderProp } from '../../types.js'
import { FullscreenButtonDataAttributes } from './fullscreen-button.data-attributes.js'

// ============================================================================
// FullscreenButton Props
// ============================================================================

export interface FullscreenButtonProps
  extends Omit<React.ComponentPropsWithRef<'button'>, 'children'> {
  render?: RenderProp<FullscreenButtonRenderProps, FullscreenButtonState>
  children?: React.ReactNode
}

export interface FullscreenButtonRenderProps {
  ref: React.Ref<HTMLButtonElement>
  type: 'button'
  'aria-label': string
  'aria-pressed': boolean
  disabled: boolean
  [FullscreenButtonDataAttributes.fullscreen]?: boolean
  [FullscreenButtonDataAttributes.supported]?: boolean
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export interface FullscreenButtonState {
  fullscreen: boolean
  supported: boolean
}

// ============================================================================
// FullscreenButton Component
// ============================================================================

export const FullscreenButton = React.forwardRef<
  HTMLButtonElement,
  FullscreenButtonProps
>(function FullscreenButton(props, forwardedRef) {
  const { render, onClick, children, ...buttonProps } = props
  const context = useVideoPlayerContext('FullscreenButton')

  // Defer to after hydration to avoid mismatch
  const [supported, setSupported] = React.useState(false)
  React.useEffect(() => {
    setSupported('fullscreenEnabled' in document && document.fullscreenEnabled)
  }, [])

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (!event.defaultPrevented) {
        context.toggleFullscreen()
      }
    },
    [onClick, context],
  )

  const state: FullscreenButtonState = {
    fullscreen: context.fullscreen,
    supported,
  }

  const renderProps: FullscreenButtonRenderProps = {
    ref: forwardedRef,
    type: 'button',
    'aria-label': context.fullscreen ? 'Exit fullscreen' : 'Enter fullscreen',
    'aria-pressed': context.fullscreen,
    disabled: !supported,
    [FullscreenButtonDataAttributes.fullscreen]:
      context.fullscreen || undefined,
    [FullscreenButtonDataAttributes.supported]: supported || undefined,
    onClick: handleClick,
  }

  if (render) {
    return render(renderProps, state)
  }

  return (
    <button {...renderProps} {...buttonProps}>
      {children}
    </button>
  )
})

// ============================================================================
// Namespace
// ============================================================================

export namespace FullscreenButton {
  export type Props = FullscreenButtonProps
  export type State = FullscreenButtonState
  export type RenderProps = FullscreenButtonRenderProps
}
