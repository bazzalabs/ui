'use client'

import * as React from 'react'
import { useVideoPlayerContext } from '../../contexts/video-player-context.js'
import type { RenderProp, VideoQuality } from '../../types.js'
import {
  QualityMenuDataAttributes,
  QualityMenuItemDataAttributes,
} from './quality-menu.data-attributes.js'

// ============================================================================
// QualityMenu Props
// ============================================================================

export interface QualityMenuProps extends React.ComponentPropsWithRef<'div'> {
  render?: RenderProp<QualityMenuRenderProps, QualityMenuState>
}

export interface QualityMenuRenderProps {
  ref: React.Ref<any>
  role: 'menu'
  'aria-label': string
  [QualityMenuDataAttributes.quality]?: string
}

export interface QualityMenuState {
  qualities: VideoQuality[]
  activeQuality: VideoQuality | null
}

// ============================================================================
// QualityMenu Component
// ============================================================================

export const QualityMenu = React.forwardRef<HTMLDivElement, QualityMenuProps>(
  function QualityMenu(props, forwardedRef) {
    const { render, children, ...divProps } = props
    const context = useVideoPlayerContext('QualityMenu')

    const state: QualityMenuState = {
      qualities: context.qualities,
      activeQuality: context.activeQuality,
    }

    const renderProps: QualityMenuRenderProps = {
      ref: forwardedRef,
      role: 'menu',
      'aria-label': 'Video quality',
      [QualityMenuDataAttributes.quality]:
        context.activeQuality?.label ?? undefined,
    }

    if (render) {
      return render(renderProps, state)
    }

    // Default render: list of quality options
    return (
      <div {...renderProps} {...divProps}>
        {children ??
          context.qualities.map((quality) => (
            <QualityMenuItem key={quality.label} quality={quality}>
              {quality.label}
            </QualityMenuItem>
          ))}
      </div>
    )
  },
)

// ============================================================================
// QualityMenuItem
// ============================================================================

export interface QualityMenuItemProps
  extends React.ComponentPropsWithRef<'button'> {
  quality: VideoQuality
}

export const QualityMenuItem = React.forwardRef<
  HTMLButtonElement,
  QualityMenuItemProps
>(function QualityMenuItem(props, forwardedRef) {
  const { quality, onClick, children, ...buttonProps } = props
  const context = useVideoPlayerContext('QualityMenuItem')

  const isActive = context.activeQuality?.label === quality.label

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (!event.defaultPrevented) {
        context.setQuality(quality)
      }
    },
    [onClick, context, quality],
  )

  return (
    <button
      ref={forwardedRef}
      type="button"
      role="menuitemradio"
      aria-checked={isActive}
      {...{ [QualityMenuItemDataAttributes.active]: isActive || undefined }}
      {...buttonProps}
      onClick={handleClick}
    >
      {children}
    </button>
  )
})

// ============================================================================
// Namespace
// ============================================================================

export namespace QualityMenu {
  export type Props = QualityMenuProps
  export type State = QualityMenuState
  export type ItemProps = QualityMenuItemProps
}
