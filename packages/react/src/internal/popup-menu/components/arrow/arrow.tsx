'use client'

import { Popover, type PopoverArrowProps } from '@base-ui/react/popover'
import * as React from 'react'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'

export interface PopupMenuArrowProps extends PopoverArrowProps {}

/**
 * An optional arrow element to render alongside the popup menu.
 * This can be used to help visually link the trigger with the popup.
 * Must be rendered inside `Popup`.
 * Renders a `<div>` element.
 */
export const PopupMenuArrow = React.forwardRef<
  HTMLDivElement,
  PopupMenuArrowProps
>(function PopupMenuArrow(props, forwardedRef) {
  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'arrow')

  return (
    <Popover.Arrow
      ref={forwardedRef}
      {...(slotAttr ? { [slotAttr]: '' } : {})}
      {...props}
    />
  )
})

export namespace PopupMenuArrow {
  export type Props = PopupMenuArrowProps
  export type State = Popover.Arrow.State
}
