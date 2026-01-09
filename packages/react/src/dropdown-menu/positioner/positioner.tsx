'use client'

import { Popover, type PopoverPositionerProps } from '@base-ui/react/popover'

/**
 * Positions the dropdown menu popup against the trigger.
 * Renders a `<div>` element.
 */
export const DropdownMenuPositioner = Popover.Positioner

export namespace DropdownMenuPositioner {
  export type Props = PopoverPositionerProps
  export type State = Popover.Positioner.State
}
