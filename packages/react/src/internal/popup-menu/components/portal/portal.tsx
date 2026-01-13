'use client'

import { Popover, type PopoverPortalProps } from '@base-ui/react/popover'

export interface PopupMenuPortalProps extends PopoverPortalProps {}

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 */
export const PopupMenuPortal = Popover.Portal

export namespace PopupMenuPortal {
  export type Props = PopoverPortalProps
  export type State = Popover.Portal.State
}
