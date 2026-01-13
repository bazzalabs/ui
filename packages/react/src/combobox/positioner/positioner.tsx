'use client'

import { Popover, type PopoverPositionerProps } from '@base-ui/react/popover'
import * as React from 'react'
import { useComboboxContext } from '../contexts/combobox-context.js'

// ============================================================================
// Types
// ============================================================================

export interface ComboboxPositionerProps extends PopoverPositionerProps {}

// ============================================================================
// Component
// ============================================================================

/**
 * Positions the combobox popup against the input.
 * Uses the input element as the anchor for positioning.
 *
 * Renders a `<div>` element.
 */
export const ComboboxPositioner = React.forwardRef<
  HTMLDivElement,
  ComboboxPositionerProps
>(function ComboboxPositioner(props, forwardedRef) {
  const {
    side = 'bottom',
    align = 'start',
    sideOffset = 4,
    anchor: anchorProp,
    ...rest
  } = props

  const comboboxContext = useComboboxContext()

  // Use the input element as the anchor, unless explicitly provided
  const anchor = anchorProp ?? comboboxContext.inputRef

  return (
    <Popover.Positioner
      ref={forwardedRef}
      side={side}
      align={align}
      sideOffset={sideOffset}
      anchor={anchor}
      {...rest}
    />
  )
})

export namespace ComboboxPositioner {
  export type Props = ComboboxPositionerProps
  export type State = Popover.Positioner.State
}
