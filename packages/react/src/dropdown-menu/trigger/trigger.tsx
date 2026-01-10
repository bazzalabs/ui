'use client'

import { Popover, type PopoverTriggerProps } from '@base-ui/react/popover'

export interface DropdownMenuTriggerProps extends PopoverTriggerProps {
  /**
   * Whether the menu opens when hovering the trigger.
   * @default false
   */
  openOnHover?: boolean

  /**
   * Delay before opening on hover (in milliseconds).
   * Only applies when `openOnHover` is true.
   * @default 100
   */
  delay?: number

  /**
   * Delay before closing when pointer leaves (in milliseconds).
   * Only applies when `openOnHover` is true.
   * @default 0
   */
  closeDelay?: number
}

/**
 * A button that opens the dropdown menu.
 * Renders a `<button>` element.
 *
 * Supports `openOnHover` to open the menu when hovering the trigger,
 * with configurable `delay` and `closeDelay`.
 */
export const DropdownMenuTrigger = Popover.Trigger

export namespace DropdownMenuTrigger {
  export interface Props extends DropdownMenuTriggerProps {}
  export type State = Popover.Trigger.State
}
