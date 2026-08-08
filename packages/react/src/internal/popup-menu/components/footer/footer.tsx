'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useFocusZoneRegistration } from '../focus-zone/use-focus-zone-registration.js'

/**
 * Container for tabbable content at the bottom of a menu surface (action rows like Apply/Cancel). Registers as a focus zone: its tabbable children join the surface's Tab cycle.
 */
export interface PopupMenuFooterState extends Record<string, unknown> {}

export interface PopupMenuFooterProps
  extends ComponentProps<'div', PopupMenuFooter.State> {}

export const PopupMenuFooter = React.forwardRef<
  HTMLDivElement,
  PopupMenuFooter.Props
>(function PopupMenuFooter(props, forwardedRef) {
  const { render, className, style, ...rest } = props
  const [element, setElement] = React.useState<HTMLElement | null>(null)
  useFocusZoneRegistration(element)

  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'footer')

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

export namespace PopupMenuFooter {
  export type State = PopupMenuFooterState
  export interface Props extends PopupMenuFooterProps {}
}
