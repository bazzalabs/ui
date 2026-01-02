'use client'

import * as React from 'react'
import { Popover } from '@base-ui/react/popover'

/**
 * Props for the DropdownMenuBackdrop component
 */
export interface DropdownMenuBackdropProps extends Popover.Backdrop.Props {}

export namespace DropdownMenuBackdrop {
  export type Props = DropdownMenuBackdropProps
  export type State = Popover.Backdrop.State
}

/**
 * An overlay displayed beneath the dropdown menu.
 * Renders a `<div>` element.
 */
export const DropdownMenuBackdrop = React.forwardRef<
  HTMLDivElement,
  DropdownMenuBackdrop.Props
>(function DropdownMenuBackdrop(props, ref) {
  return <Popover.Backdrop ref={ref} {...props} />
})

DropdownMenuBackdrop.displayName = 'DropdownMenuBackdrop'
