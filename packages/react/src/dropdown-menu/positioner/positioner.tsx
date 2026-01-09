'use client'

import { Popover, type PopoverPositionerProps } from '@base-ui/react/popover'
import * as React from 'react'
import { useRootContext } from '../contexts/root-context.js'

export interface DropdownMenuPositionerProps extends PopoverPositionerProps {}

/**
 * Positions the dropdown menu popup against the trigger.
 * Renders a `<div>` element.
 *
 * Defaults to `side="bottom"` for root menus and `side="right"` for submenus.
 */
export const DropdownMenuPositioner = React.forwardRef<
  HTMLDivElement,
  DropdownMenuPositionerProps
>(function DropdownMenuPositioner(props, ref) {
  const { side: sideProp, align: alignProp, ...rest } = props
  const { depth } = useRootContext()

  // Default side based on nesting depth:
  // - Root menu (depth 0): bottom
  // - Submenus (depth > 0): right
  const defaultSide = depth > 0 ? 'right' : 'bottom'
  const side = sideProp ?? defaultSide

  const defaultAlign = depth > 0 ? 'start' : 'center'
  const align = alignProp ?? defaultAlign

  return <Popover.Positioner ref={ref} side={side} align={align} {...rest} />
})

export namespace DropdownMenuPositioner {
  export type Props = DropdownMenuPositionerProps
  export type State = Popover.Positioner.State
}
