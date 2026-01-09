'use client'

import { Popover, type PopoverTriggerProps } from '@base-ui/react/popover'

/**
 * A button that opens the dropdown menu.
 * Renders a `<button>` element.
 */
export const DropdownMenuTrigger = Popover.Trigger

export namespace DropdownMenuTrigger {
  export type Props = PopoverTriggerProps
  export type State = Popover.Trigger.State
}
