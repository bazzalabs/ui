'use client'

import { Popover, type PopoverArrowProps } from '@base-ui/react/popover'

/**
 * An optional arrow element to render alongside the popup menu.
 * This can be used to help visually link the trigger with the popup.
 * Must be rendered inside `Popup`.
 * Renders a `<div>` element.
 */
export const PopupMenuArrow = Popover.Arrow

export interface PopupMenuArrowProps extends PopoverArrowProps {}

export namespace PopupMenuArrow {
  export type Props = PopoverArrowProps
  export type State = Popover.Arrow.State
}
