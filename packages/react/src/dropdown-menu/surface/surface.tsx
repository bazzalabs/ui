'use client'

import { useRender } from '@base-ui/react/use-render'
import { useStableCallback } from '@base-ui/utils/useStableCallback'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { useRootContext } from '../contexts/root-context.js'
import { type FilterFn, SurfaceContext } from '../contexts/surface-context.js'
import { defaultFilter } from '../utils/command-score.js'

// Surface doesn't expose data attributes - using empty state
export interface DropdownMenuSurfaceState extends Record<string, unknown> {}

export interface DropdownMenuSurfaceProps
  extends ComponentProps<'div', DropdownMenuSurfaceState> {
  /**
   * Filter function for matching items against search query.
   * Returns a score between 0 and 1 (0 = no match, > 0 = match).
   * Pass `false` to disable filtering entirely.
   * @default commandScore (fuzzy matching)
   */
  filter?: FilterFn | false

  /**
   * Controlled search value.
   */
  search?: string

  /**
   * Callback when search value changes.
   */
  onSearchChange?: (search: string) => void

  /**
   * Default search value for uncontrolled usage.
   * @default ''
   */
  defaultSearch?: string

  /**
   * Whether navigation should loop from last to first item and vice versa.
   * @default true
   */
  loop?: boolean

  /**
   * Whether to automatically highlight the first item when the menu opens
   * or when search results change.
   * @default true
   */
  autoHighlightFirst?: boolean

  /**
   * Whether to clear the search query when the menu closes.
   * @default true
   */
  clearSearchOnClose?: boolean

  children: React.ReactNode
}

/**
 * Provides search context and manages item registration for dropdown menu.
 * Place inside DropdownMenu.Popup to enable search functionality.
 * Renders a `<div>` element.
 */
export const DropdownMenuSurface = React.forwardRef<
  HTMLDivElement,
  DropdownMenuSurfaceProps
>(function DropdownMenuSurface(props, forwardedRef) {
  const {
    filter = defaultFilter,
    search: searchProp,
    onSearchChange,
    defaultSearch = '',
    loop = true,
    autoHighlightFirst = true,
    clearSearchOnClose = true,
    render,
    className,
    style,
    onPointerDown,
    children,
    ...rest
  } = props

  // Get store from Root context
  const { store } = useRootContext()

  // Generate stable IDs
  const listId = React.useId()
  const inputId = React.useId()

  // Create stable callback for onSearchChange
  const handleSearchChange = useStableCallback((search: string) => {
    onSearchChange?.(search)
  })

  // Update store context with surface configuration
  React.useEffect(() => {
    store.context.filter = filter
    store.context.loop = loop
    store.context.autoHighlightFirst = autoHighlightFirst
    store.context.clearSearchOnClose = clearSearchOnClose
    store.context.listId = listId
    store.context.inputId = inputId
    store.context.onSearchChange = handleSearchChange
  }, [
    store,
    filter,
    loop,
    autoHighlightFirst,
    clearSearchOnClose,
    listId,
    inputId,
    handleSearchChange,
  ])

  // Sync controlled search prop to store
  store.useControlledProp('search', searchProp, defaultSearch)

  const contextValue = React.useMemo(
    () => ({
      store,
    }),
    [store],
  )

  // Prevent pointer down from stealing focus from Input
  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      onPointerDown?.(event)
    },
    [onPointerDown],
  )

  const element = useRender({
    render,
    ref: forwardedRef,
    props: {
      ...rest,
      className,
      style,
      onPointerDown: handlePointerDown,
      children,
    },
    defaultTagName: 'div',
  })

  return (
    <SurfaceContext.Provider value={contextValue}>
      {element}
    </SurfaceContext.Provider>
  )
})

export namespace DropdownMenuSurface {
  export type State = DropdownMenuSurfaceState
  export interface Props extends DropdownMenuSurfaceProps {}
}
