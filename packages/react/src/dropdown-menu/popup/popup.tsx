'use client'

import { Popover, type PopoverPopupProps } from '@base-ui/react/popover'

/**
 * A container for the dropdown menu contents.
 * Renders a `<div>` element.
 */
export const DropdownMenuPopup = Popover.Popup

export namespace DropdownMenuPopup {
  export type Props = PopoverPopupProps
  export type State = Popover.Popup.State
}
