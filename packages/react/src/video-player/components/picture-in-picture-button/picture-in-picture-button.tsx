'use client'

import * as React from 'react'
import type { WithPreventableBaseHandlers } from '../../../utils/types.js'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import type { RenderProp } from '../../types.js'
import { mergeElementProps } from '../../utils/merge-element-props.js'
import { PictureInPictureButtonDataAttributes } from './picture-in-picture-button.data-attributes.js'

// ============================================================================
// PictureInPictureButton Props
// ============================================================================

export interface PictureInPictureButtonProps
  extends WithPreventableBaseHandlers<React.ComponentPropsWithRef<'button'>> {
  render?: RenderProp<
    PictureInPictureButtonRenderProps,
    PictureInPictureButtonState
  >
}

export interface PictureInPictureButtonRenderProps {
  ref: React.Ref<HTMLButtonElement>
  type: React.ButtonHTMLAttributes<HTMLButtonElement>['type']
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
  const { render, ...buttonProps } = props
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

  const renderProps = mergeElementProps(
    {
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
      onClick() {
        context.togglePictureInPicture()
      },
    },
    buttonProps,
  )

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
