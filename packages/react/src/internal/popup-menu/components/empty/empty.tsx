'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import { useSurfaceContext } from '../../../listbox/index.js'

// Empty doesn't have any state - using an empty object type
export interface PopupMenuEmptyState extends Record<string, unknown> {}

export interface PopupMenuEmptyProps
  extends ComponentProps<'div', PopupMenuEmpty.State> {
  children: React.ReactNode
}

/**
 * Renders when no items match the current search query.
 * Only visible when there's an active search with zero results.
 * Renders a `<div>` element.
 */
export const PopupMenuEmpty = React.forwardRef<
  HTMLDivElement,
  PopupMenuEmpty.Props
>(function PopupMenuEmpty(props, forwardedRef) {
  const { render, className, style, children, ...rest } = props

  const { store } = useSurfaceContext()

  const element = useRender({
    render,
    ref: forwardedRef,
    props: {
      ...rest,
      role: 'presentation',
      className,
      style,
      children,
    },
    defaultTagName: 'div',
  })

  // Use dedicated selector for this check
  const shouldRender = store.useState('hasSearchWithNoResults')

  if (!shouldRender) {
    return null
  }

  return element
})

export namespace PopupMenuEmpty {
  export type State = PopupMenuEmptyState
  export interface Props extends PopupMenuEmptyProps {}
}
