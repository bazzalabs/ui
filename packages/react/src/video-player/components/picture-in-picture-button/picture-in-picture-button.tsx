'use client'

import * as React from 'react'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import type { RenderProp } from '../../types.js'
import { PictureInPictureButtonDataAttributes } from './picture-in-picture-button.data-attributes.js'

// ============================================================================
// PictureInPictureButton Props
// ============================================================================

export interface PictureInPictureButtonProps
  extends React.ComponentPropsWithRef<'button'> {
  render?: RenderProp<
    PictureInPictureButtonRenderProps,
    PictureInPictureButtonState
  >
}

export interface PictureInPictureButtonRenderProps {
  ref: React.Ref<HTMLButtonElement>
  type: 'button'
  'aria-label': string
  'aria-pressed': boolean
  disabled: boolean
  [PictureInPictureButtonDataAttributes.pip]?: boolean
  [PictureInPictureButtonDataAttributes.supported]?: boolean
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export interface PictureInPictureButtonState {
  pictureInPicture: boolean
  supported: boolean
}

// ============================================================================
// PictureInPictureButton Component
// ============================================================================

export const PictureInPictureButton = React.forwardRef<
  HTMLButtonElement,
  PictureInPictureButtonProps
>(function PictureInPictureButton(props, forwardedRef) {
  const { render, onClick, ...buttonProps } = props
  const context = useVideoPlayerContext('PictureInPictureButton')

  // Defer to after hydration to avoid mismatch
  const [supported, setSupported] = React.useState(false)
  React.useEffect(() => {
    setSupported(
      'pictureInPictureEnabled' in document && document.pictureInPictureEnabled,
    )
  }, [])

  const state: PictureInPictureButtonState = {
    pictureInPicture: context.pictureInPicture,
    supported,
  }

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (!event.defaultPrevented) {
        context.togglePictureInPicture()
      }
    },
    [onClick, context],
  )

  const renderProps: PictureInPictureButtonRenderProps = {
    ref: forwardedRef,
    type: 'button',
    'aria-label': context.pictureInPicture
      ? 'Exit picture-in-picture'
      : 'Enter picture-in-picture',
    'aria-pressed': context.pictureInPicture,
    disabled: !supported,
    [PictureInPictureButtonDataAttributes.pip]:
      context.pictureInPicture || undefined,
    [PictureInPictureButtonDataAttributes.supported]: supported || undefined,
    onClick: handleClick,
  }

  if (render) {
    return render(renderProps, state)
  }

  return <button {...renderProps} {...buttonProps} />
})

// ============================================================================
// Namespace
// ============================================================================

export namespace PictureInPictureButton {
  export type Props = PictureInPictureButtonProps
  export type State = PictureInPictureButtonState
}
