'use client'

import * as React from 'react'
import type { WithPreventableBaseHandlers } from '../../../utils/types.js'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import type { RenderProp } from '../../types.js'
import { mergeElementProps } from '../../utils/merge-element-props.js'
import { FullscreenButtonDataAttributes } from './fullscreen-button.data-attributes.js'

// ============================================================================
// FullscreenButton Props
// ============================================================================

export interface FullscreenButtonProps
  extends Omit<
    WithPreventableBaseHandlers<React.ComponentPropsWithRef<'button'>>,
    'children'
  > {
  render?: RenderProp<FullscreenButtonRenderProps, FullscreenButtonState>
  children?: React.ReactNode
}

export interface FullscreenButtonRenderProps {
  ref: React.Ref<HTMLButtonElement>
  type: React.ButtonHTMLAttributes<HTMLButtonElement>['type']
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
  const { render, children, ...buttonProps } = props
  const context = useVideoPlayerContext('FullscreenButton')

  // Defer to after hydration to avoid mismatch
  const [supported, setSupported] = React.useState(false)
  React.useEffect(() => {
    setSupported('fullscreenEnabled' in document && document.fullscreenEnabled)
  }, [])

  const state: FullscreenButtonState = {
    fullscreen: context.fullscreen,
    supported,
  }

  const renderProps = mergeElementProps(
    {
      ref: forwardedRef,
      type: 'button',
      'aria-label': context.fullscreen ? 'Exit fullscreen' : 'Enter fullscreen',
      'aria-pressed': context.fullscreen,
      disabled: !supported,
      [FullscreenButtonDataAttributes.fullscreen]:
        context.fullscreen || undefined,
      [FullscreenButtonDataAttributes.supported]: supported || undefined,
      onClick() {
        context.toggleFullscreen()
      },
    },
    buttonProps,
  )

  if (render) {
    return render(renderProps, state)
  }

  return <button {...renderProps}>{children}</button>
})

// ============================================================================
// Namespace
// ============================================================================

export namespace FullscreenButton {
  export type Props = FullscreenButtonProps
  export type State = FullscreenButtonState
  export type RenderProps = FullscreenButtonRenderProps
}
