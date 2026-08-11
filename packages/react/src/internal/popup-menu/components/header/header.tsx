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
 * Container for tabbable content at the top of a menu surface (toolbars, filters). Registers as a focus zone: its tabbable children join the surface's Tab cycle.
 */
export interface PopupMenuHeaderState extends Record<string, unknown> {}

export interface PopupMenuHeaderProps
  extends ComponentProps<'div', PopupMenuHeader.State> {}

export const PopupMenuHeader = React.forwardRef<
  HTMLDivElement,
  PopupMenuHeader.Props
>(function PopupMenuHeader(props, forwardedRef) {
  const { render, className, style, ...rest } = props
  const [element, setElement] = React.useState<HTMLElement | null>(null)
  useFocusZoneRegistration(element)

  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'header')

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

export namespace PopupMenuHeader {
  export type State = PopupMenuHeaderState
  export interface Props extends PopupMenuHeaderProps {}
}
