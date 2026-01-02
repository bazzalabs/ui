'use client'

import * as React from 'react'
import { Popover } from '@base-ui/react/popover'

/**
 * Props for the DropdownMenuPositioner component
 */
export interface DropdownMenuPositionerProps extends Popover.Positioner.Props {}

export namespace DropdownMenuPositioner {
  export type Props = DropdownMenuPositionerProps
  export type State = Popover.Positioner.State
}

/**
 * Positions the dropdown menu against the trigger.
 * Renders a `<div>` element.
 */
export const DropdownMenuPositioner = React.forwardRef<
  HTMLDivElement,
  DropdownMenuPositioner.Props
>(function DropdownMenuPositioner(props, ref) {
  return <Popover.Positioner ref={ref} {...props} />
})

DropdownMenuPositioner.displayName = 'DropdownMenuPositioner'
