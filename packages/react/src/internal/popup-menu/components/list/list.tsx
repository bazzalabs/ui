'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import { useListboxContext, useSurfaceContext } from '../../../listbox/index.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { useMaybeSubmenuContext } from '../../contexts/submenu-context.js'
import { usePopupMenuKeyboard } from '../../hooks/use-popup-menu-keyboard.js'

/**
 * State passed to children render function.
 */
export interface PopupMenuListChildrenState {
  /** Current search query */
  search: string
  /** Number of items matching the current filter */
  filteredCount: number
}

// List doesn't expose data attributes - using empty state
export interface PopupMenuListState extends Record<string, unknown> {}

export interface PopupMenuListProps
  extends Omit<ComponentProps<'div', PopupMenuListState>, 'children'> {
  /**
   * Content to render inside the list.
   * Can be a render function that receives the current search state.
   */
  children:
    | React.ReactNode
    | ((state: PopupMenuListChildrenState) => React.ReactNode)

  /**
   * Accessible label for the listbox.
   * @default 'Suggestions'
   */
  label?: string
}

/**
 * Container for popup menu items.
 * Supports render props for accessing search state.
 * Renders a `<div>` element with role="listbox".
 */
export const PopupMenuList = React.forwardRef<
  HTMLDivElement,
  PopupMenuListProps
>(function PopupMenuList(props, forwardedRef) {
  const {
    children,
    label = 'Suggestions',
    render,
    className,
    style,
    onKeyDown,
    onPointerDown,
    ...rest
  } = props

  const { store, surfaceId } = useSurfaceContext()
  const { depth, closeAll } = useListboxContext()
  const submenuContext = useMaybeSubmenuContext()
  const focusOwnerStore = useFocusOwner()
  const internalRef = React.useRef<HTMLDivElement>(null)

  // Register list ref with store for scroll behavior
  React.useEffect(() => {
    store.setListRef(internalRef)
  }, [store])

  // Get values from store
  const search = store.useState('search')
  const filteredCount = store.useState('filteredCount')
  const hasInput = store.useState('hasInput')
  const highlightedId = store.useState('highlightedId')
  const listId = store.context.listId

  // When there's no Input, the List should receive focus and handle keyboard nav
  // Note: Auto-focus is handled by Surface when it becomes the focus owner
  const shouldHandleKeyboard = !hasInput

  // Use centralized keyboard navigation hook
  const { handleKeyDown } = usePopupMenuKeyboard({
    store,
    surfaceId,
    focusOwnerStore,
    depth,
    submenuContext,
    enabled: shouldHandleKeyboard,
    enableTypeToSearch: true,
    onKeyDown,
    closeAll,
  })

  // Prevent pointer down from stealing focus from Input
  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      onPointerDown?.(event)
    },
    [onPointerDown],
  )

  const childrenState: PopupMenuListChildrenState = React.useMemo(
    () => ({
      search,
      filteredCount,
    }),
    [search, filteredCount],
  )

  const renderedChildren =
    typeof children === 'function' ? children(childrenState) : children

  return useRender({
    render,
    ref: [internalRef, forwardedRef],
    props: {
      ...rest,
      id: listId,
      role: 'listbox',
      'aria-label': label,
      'aria-activedescendant': shouldHandleKeyboard
        ? (highlightedId ?? undefined)
        : undefined,
      tabIndex: shouldHandleKeyboard ? 0 : -1,
      className,
      style,
      onKeyDown: handleKeyDown,
      onPointerDown: handlePointerDown,
      children: renderedChildren,
    },
    defaultTagName: 'div',
  })
})

export namespace PopupMenuList {
  export type State = PopupMenuListState
  export type ChildrenState = PopupMenuListChildrenState
  export interface Props extends PopupMenuListProps {}
}
