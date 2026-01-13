'use client'

import { Popover, type PopoverPositionerProps } from '@base-ui/react/popover'
import * as React from 'react'
import { usePopupMenuContext } from '../../contexts/popup-menu-context.js'

// ============================================================================
// Types
// ============================================================================

export interface PopupMenuPositionerProps extends PopoverPositionerProps {
  /**
   * Override the virtual anchor from context.
   * Useful for nested menus that need different positioning.
   */
  virtualAnchor?: { getBoundingClientRect(): DOMRect }
}

// ============================================================================
// Component
// ============================================================================

/**
 * Positions the popup menu against its anchor.
 * Wraps Popover.Positioner with:
 * - Automatic virtualAnchor from PopupMenuContext (for context menus)
 * - Smart default positioning based on depth and menu type
 *
 * Renders a `<div>` element.
 */
export const PopupMenuPositioner = React.forwardRef<
  HTMLDivElement,
  PopupMenuPositionerProps
>(function PopupMenuPositioner(props, ref) {
  const {
    side: sideProp,
    align: alignProp,
    virtualAnchor: virtualAnchorProp,
    ...rest
  } = props

  const {
    depth,
    virtualAnchor: contextVirtualAnchor,
    menuType,
  } = usePopupMenuContext()

  // For submenus (depth > 0), we should NOT use the context's virtualAnchor
  // because the submenu should anchor to its trigger element, not the cursor position.
  // Only the root menu (depth 0) should use the virtual anchor for context menus.
  const isSubmenu = depth > 0
  const virtualAnchor = isSubmenu
    ? virtualAnchorProp // Only use explicit prop for submenus (usually undefined)
    : (virtualAnchorProp ?? contextVirtualAnchor)

  // Default side based on depth:
  // - Root menu (depth 0): bottom for dropdown, start for context
  // - Submenu (depth > 0): right
  const defaultSide = isSubmenu ? 'right' : 'bottom'
  const side = sideProp ?? defaultSide

  // Align defaults to start for submenus, center for root dropdown, start for context
  const defaultAlign = isSubmenu
    ? 'start'
    : menuType === 'context'
      ? 'start'
      : 'center'
  const align = alignProp ?? defaultAlign

  // Only pass anchor if we have one - otherwise let Popover use its default (Trigger element)
  const anchorProps = virtualAnchor ? { anchor: virtualAnchor } : {}

  return (
    <Popover.Positioner
      ref={ref}
      side={side}
      align={align}
      {...anchorProps}
      {...rest}
    />
  )
})

export namespace PopupMenuPositioner {
  export type Props = PopupMenuPositionerProps
  export type State = Popover.Positioner.State
}
