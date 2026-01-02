'use client'

import * as React from 'react'
import { Popover } from '@base-ui/react/popover'

/**
 * Props for the DropdownMenuTrigger component
 */
export interface DropdownMenuTriggerProps extends Popover.Trigger.Props {}

export namespace DropdownMenuTrigger {
  export type Props = DropdownMenuTriggerProps
  export type State = Popover.Trigger.State
}

/**
 * A button that opens the dropdown menu.
 * Renders a `<button>` element.
 */
export const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTrigger.Props
>(function DropdownMenuTrigger(props, ref) {
  const { onPointerDown, ...otherProps } = props

  // Prevent pointerdown from stealing focus from the input
  const handlePointerDown = React.useCallback(
    (event: Parameters<NonNullable<typeof onPointerDown>>[0]) => {
      event.preventDefault()
      onPointerDown?.(event)
    },
    [onPointerDown],
  )

  return (
    <Popover.Trigger
      ref={ref}
      onPointerDown={handlePointerDown}
      {...otherProps}
    />
  )
})

DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'
