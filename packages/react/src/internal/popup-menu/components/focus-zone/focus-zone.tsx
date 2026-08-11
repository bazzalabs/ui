'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useFocusZoneRegistration } from './use-focus-zone-registration.js'

/**
 * Declares its children as tabbable popup content: they join the surface's Tab
 * cycle instead of Tab closing the menu. A zone with no tabbable children is
 * treated as absent.
 */
export interface PopupMenuFocusZoneState extends Record<string, unknown> {}

export interface PopupMenuFocusZoneProps
  extends ComponentProps<'div', PopupMenuFocusZone.State> {}

export const PopupMenuFocusZone = React.forwardRef<
  HTMLDivElement,
  PopupMenuFocusZone.Props
>(function PopupMenuFocusZone(props, forwardedRef) {
  const { render, className, style, ...rest } = props
  const [element, setElement] = React.useState<HTMLElement | null>(null)
  useFocusZoneRegistration(element)

  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'focus-zone')

  return useRender({
    render,
    ref: [setElement, forwardedRef],
    state: {},
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      className,
      style,
    },
    defaultTagName: 'div',
  })
})

export namespace PopupMenuFocusZone {
  export type State = PopupMenuFocusZoneState
  export interface Props extends PopupMenuFocusZoneProps {}
}
