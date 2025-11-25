import { Popover } from '@base-ui-components/react/popover'
import { mergeProps } from '@bazza-ui/theming'
import { composeRefs } from '@radix-ui/react-compose-refs'
import * as React from 'react'
import { useScopedTheme } from '../../contexts/theme-context.js'
import { useNavKeydown } from '../../hooks/use-nav-keydown.js'
import type { ContentBindAPI } from '../../types.js'
import { useSurface } from '../surface/surface-provider.js'

export interface PopupProps {
  children: React.ReactNode
}

/**
 * Popup component - The visual wrapper.
 * Creates the content binding internally using surface context.
 * This allows useNavKeydown to be called where it has access to SurfaceProvider.
 */
export function Popup({ children }: PopupProps) {
  const { slots, classNames, slotProps } = useScopedTheme()
  const surface = useSurface()
  const { Content } = slots

  // Now we can call useNavKeydown since we're inside SurfaceProvider
  const handleKeyDown = useNavKeydown(surface.surfaceId, surface.onClose)

  // Create a function that builds the content binding with Base UI props
  const createContentBind = React.useCallback(
    (baseUIPopupProps: any): ContentBindAPI => {
      return {
        getContentProps: (overrides) => {
          const baseUIRef = baseUIPopupProps?.ref
          const composedRef = baseUIRef
            ? composeRefs(surface.contentRef as any, baseUIRef)
            : surface.contentRef

          return mergeProps(
            {
              role: 'menu' as const,
              tabIndex: -1,
              'data-slot': surface.isSubmenu
                ? 'popup-menu-submenu-content'
                : 'popup-menu-content',
              'data-popup-menu-surface': true,
              'data-root-menu': surface.isSubmenu ? undefined : true,
              'data-sub-menu': surface.isSubmenu ? 'true' : undefined,
              'data-surface-id': surface.surfaceId,
              ...slotProps?.content,
              ...baseUIPopupProps,
              onMouseMove: surface.handleMouseMove,
              className: classNames?.content,
              ref: composedRef,
              onKeyDown: handleKeyDown,
            },
            overrides,
          ) as any
        },
      }
    },
    [
      handleKeyDown,
      surface.contentRef,
      surface.isSubmenu,
      surface.surfaceId,
      slotProps?.content,
      surface.handleMouseMove,
      classNames?.content,
    ],
  )

  return (
    <Popover.Popup
      initialFocus={false}
      render={(popupProps) => {
        const contentBind = createContentBind(popupProps)
        return <Content bind={contentBind}>{children}</Content>
      }}
    />
  )
}
