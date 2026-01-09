'use client'

import * as React from 'react'
import { useSurfaceContext } from '../contexts/surface-context.js'

export interface DropdownMenuEmptyProps
  extends React.ComponentPropsWithoutRef<'div'> {
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
  const { children, ...rest } = props

  const { store } = useSurfaceContext()

  // Use dedicated selector for this check
  const shouldRender = store.useState('hasSearchWithNoResults')

  if (!shouldRender) {
    return null
  }

  return (
    <div ref={forwardedRef} {...rest} role="presentation">
      {children}
    </div>
  )
})

export namespace DropdownMenuEmpty {
  export interface Props extends DropdownMenuEmptyProps {}
}
