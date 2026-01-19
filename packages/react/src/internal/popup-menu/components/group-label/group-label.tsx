'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'

// GroupLabel doesn't have any state - using an empty object type
export interface PopupMenuGroupLabelState extends Record<string, unknown> {}

export interface PopupMenuGroupLabelProps
  extends ComponentProps<'div', PopupMenuGroupLabel.State> {
  children: React.ReactNode
}

/**
 * A label/heading for a group of popup menu items.
 * Renders a `<div>` element with role="presentation".
 */
export const PopupMenuGroupLabel = React.forwardRef<
  HTMLDivElement,
  PopupMenuGroupLabel.Props
>(function PopupMenuGroupLabel(props, forwardedRef) {
  const { render, className, style, children, ...rest } = props

  return useRender({
    render,
    ref: forwardedRef,
    props: {
      ...rest,
      // Presentation role - this is a visual label, not interactive
      role: 'presentation',
      // aria-hidden since the group label is decorative for screen readers
      // in the context of a listbox (options are the semantic elements)
      'aria-hidden': 'true',
      className,
      style,
      children,
    },
    defaultTagName: 'div',
  })
})

export namespace PopupMenuGroupLabel {
  export type State = PopupMenuGroupLabelState
  export interface Props extends PopupMenuGroupLabelProps {}
}
