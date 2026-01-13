'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import { useSurfaceContext } from '../../../listbox/index.js'

// Separator doesn't have any state - using an empty object type
export interface PopupMenuSeparatorState extends Record<string, unknown> {}

export interface PopupMenuSeparatorProps
  extends ComponentProps<'div', PopupMenuSeparatorState> {
  /**
   * Whether to always render the separator, even during search.
   * By default, separators are hidden when there's an active search query.
   * @default false
   */
  alwaysRender?: boolean
}

/**
 * A visual separator between popup menu items.
 * Hidden during active search unless `alwaysRender` is true.
 * Renders a `<div>` element with role="separator".
 */
export const PopupMenuSeparator = React.forwardRef<
  HTMLDivElement,
  PopupMenuSeparatorProps
>(function PopupMenuSeparator(props, forwardedRef) {
  const { alwaysRender = false, render, className, style, ...rest } = props

  const { store } = useSurfaceContext()

  // Get search state from store
  const search = store.useState('search')

  // Hide separator when there's an active search (unless alwaysRender)
  const hasSearch = search.length > 0
  const isHidden = hasSearch && !alwaysRender

  const element = useRender({
    render,
    ref: forwardedRef,
    props: {
      ...rest,
      // Using role="none" as this is a purely visual separator within a listbox.
      // The semantic separator role requires focus for interactive separators.
      role: 'none',
      className,
      style,
    },
    defaultTagName: 'div',
  })

  if (isHidden) {
    return null
  }

  return element
})

export namespace PopupMenuSeparator {
  export type State = PopupMenuSeparatorState
  export interface Props extends PopupMenuSeparatorProps {}
}
