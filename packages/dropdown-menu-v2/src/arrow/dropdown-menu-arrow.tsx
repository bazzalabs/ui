'use client'

import * as React from 'react'
import { Popover } from '@base-ui/react/popover'

/**
 * Props for the DropdownMenuArrow component
 */
export interface DropdownMenuArrowProps extends Popover.Arrow.Props {}

export namespace DropdownMenuArrow {
  export type Props = DropdownMenuArrowProps
  export type State = Popover.Arrow.State
}

/**
 * Displays an element positioned against the dropdown menu anchor.
 * Renders a `<div>` element.
 */
export const DropdownMenuArrow = React.forwardRef<
  HTMLDivElement,
  DropdownMenuArrow.Props
>(function DropdownMenuArrow(props, ref) {
  return <Popover.Arrow ref={ref} {...props} />
})

DropdownMenuArrow.displayName = 'DropdownMenuArrow'
