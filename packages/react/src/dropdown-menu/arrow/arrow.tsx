'use client'

import { Popover, type PopoverArrowProps } from '@base-ui/react/popover'

/**
 * An optional arrow element to render alongside the dropdown menu popup.
 * This can be used to help visually link the trigger with the popup.
 * Must be rendered inside `DropdownMenu.Popup`.
 * Renders a `<div>` element.
 */
export const DropdownMenuArrow = Popover.Arrow

export namespace DropdownMenuArrow {
  export type Props = PopoverArrowProps
  export type State = Popover.Arrow.State
}
