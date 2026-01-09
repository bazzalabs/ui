'use client'

import { Popover, type PopoverPortalProps } from '@base-ui/react/popover'

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 */
export const DropdownMenuPortal = Popover.Portal

export namespace DropdownMenuPortal {
  export type Props = PopoverPortalProps
  export type State = Popover.Portal.State
}
