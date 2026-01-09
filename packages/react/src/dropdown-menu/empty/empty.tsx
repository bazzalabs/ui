'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { useSurfaceContext } from '../contexts/surface-context.js'

// Empty doesn't have any state - using an empty object type
export interface DropdownMenuEmptyState extends Record<string, unknown> {}

export interface DropdownMenuEmptyProps
  extends ComponentProps<'div', DropdownMenuEmptyState> {
  children: React.ReactNode
}

/**
 * Renders when no items match the current search query.
 * Only visible when there's an active search with zero results.
 * Renders a `<div>` element.
 */
export const DropdownMenuEmpty = React.forwardRef<
  HTMLDivElement,
  DropdownMenuEmptyProps
>(function DropdownMenuEmpty(props, forwardedRef) {
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

export namespace DropdownMenuEmpty {
  export type State = DropdownMenuEmptyState
  export interface Props extends DropdownMenuEmptyProps {}
}
