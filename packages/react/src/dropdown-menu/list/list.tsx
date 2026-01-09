'use client'

import * as React from 'react'
import { useSurfaceContext } from '../contexts/surface-context.js'

export interface DropdownMenuListState {
  /** Current search query */
  search: string
  /** Number of items matching the current filter */
  filteredCount: number
}

export interface DropdownMenuListProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> {
  /**
   * Content to render inside the list.
   * Can be a render function that receives the current search state.
   */
  children:
    | React.ReactNode
    | ((state: DropdownMenuListState) => React.ReactNode)

  /**
   * Accessible label for the listbox.
   * @default 'Suggestions'
   */
  label?: string
}

/**
 * Container for dropdown menu items.
 * Supports render props for accessing search state.
 * Renders a `<div>` element with role="listbox".
 */
export const DropdownMenuList = React.forwardRef<
  HTMLDivElement,
  DropdownMenuListProps
>(function DropdownMenuList(props, forwardedRef) {
  const { children, label = 'Suggestions', ...rest } = props

  const { store } = useSurfaceContext()

  // Get values from store
  const search = store.useState('search')
  const filteredCount = store.useState('filteredCount')
  const listId = store.context.listId

  const listState: DropdownMenuListState = React.useMemo(
    () => ({
      search,
      filteredCount,
    }),
    [search, filteredCount],
  )

  const renderedChildren =
    typeof children === 'function' ? children(listState) : children

  return (
    <div
      ref={forwardedRef}
      {...rest}
      id={listId}
      role="listbox"
      aria-label={label}
      // Note: aria-activedescendant is also on the Input (combobox pattern).
      // The listbox mirrors it for compatibility with some screen readers.
      // Focus remains on the Input, not this element.
      tabIndex={-1}
    >
      {renderedChildren}
    </div>
  )
})

export namespace DropdownMenuList {
  export interface Props extends DropdownMenuListProps {}
  export interface State extends DropdownMenuListState {}
}
