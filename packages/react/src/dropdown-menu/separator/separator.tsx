'use client'

import * as React from 'react'
import { useSurfaceContext } from '../contexts/surface-context.js'

export interface DropdownMenuSeparatorProps
  extends React.ComponentPropsWithoutRef<'div'> {
  /**
   * Whether to always render the separator, even during search.
   * By default, separators are hidden when there's an active search query.
   * @default false
   */
  alwaysRender?: boolean
}

/**
 * A visual separator between dropdown menu items.
 * Hidden during active search unless `alwaysRender` is true.
 * Renders a `<div>` element with role="separator".
 */
export const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  DropdownMenuSeparatorProps
>(function DropdownMenuSeparator(props, forwardedRef) {
  const { alwaysRender = false, ...rest } = props

  const { store } = useSurfaceContext()

  // Get search state from store
  const search = store.useState('search')

  // Hide separator when there's an active search (unless alwaysRender)
  const hasSearch = search.length > 0
  const isHidden = hasSearch && !alwaysRender

  if (isHidden) {
    return null
  }

  return (
    <div
      ref={forwardedRef}
      {...rest}
      // Using role="none" as this is a purely visual separator within a listbox.
      // The semantic separator role requires focus for interactive separators.
      role="none"
    />
  )
})

export namespace DropdownMenuSeparator {
  export interface Props extends DropdownMenuSeparatorProps {}
}
