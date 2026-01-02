'use client'

import * as React from 'react'
import { Popover } from '@base-ui/react/popover'

/**
 * Props for the DropdownMenuPortal component
 */
export interface DropdownMenuPortalProps extends Popover.Portal.Props {}

export namespace DropdownMenuPortal {
  export type Props = DropdownMenuPortalProps
  export type State = Popover.Portal.State
}

/**
 * A portal element that moves the dropdown menu to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 */
export const DropdownMenuPortal = React.forwardRef<
  HTMLDivElement,
  DropdownMenuPortal.Props
>(function DropdownMenuPortal(props, ref) {
  return <Popover.Portal ref={ref} {...props} />
})

DropdownMenuPortal.displayName = 'DropdownMenuPortal'
