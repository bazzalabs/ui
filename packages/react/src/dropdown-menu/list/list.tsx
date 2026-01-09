'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { useRootContext } from '../contexts/root-context.js'
import { useMaybeSubmenuContext } from '../contexts/submenu-context.js'
import { useSurfaceContext } from '../contexts/surface-context.js'

/**
 * State passed to children render function.
 */
export interface DropdownMenuListChildrenState {
  /** Current search query */
  search: string
  /** Number of items matching the current filter */
  filteredCount: number
}

// List doesn't expose data attributes - using empty state
export interface DropdownMenuListState extends Record<string, unknown> {}

export interface DropdownMenuListProps
  extends Omit<ComponentProps<'div', DropdownMenuListState>, 'children'> {
  /**
   * Content to render inside the list.
   * Can be a render function that receives the current search state.
   */
  children:
    | React.ReactNode
    | ((state: DropdownMenuListChildrenState) => React.ReactNode)

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

  const { store } = useSurfaceContext()
  const { depth } = useRootContext()
  const submenuContext = useMaybeSubmenuContext()
  const internalRef = React.useRef<HTMLDivElement>(null)

  // Get values from store
  const search = store.useState('search')
  const filteredCount = store.useState('filteredCount')
  const hasInput = store.useState('hasInput')
  const highlightedId = store.useState('highlightedId')
  const listId = store.context.listId

  // When there's no Input, the List should receive focus and handle keyboard nav
  const shouldHandleKeyboard = !hasInput

  // Auto-focus when there's no input (delay to let Input register first if present)
  React.useEffect(() => {
    if (!hasInput) {
      // Use microtask to let Input register first if it exists
      queueMicrotask(() => {
        // Re-check hasInput via store.state since hasInput from useState might be stale
        if (!store.state.hasInput && internalRef.current) {
          internalRef.current.focus()
        }
      })
    }
  }, [hasInput, store])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event)

      if (event.defaultPrevented) return
      if (!shouldHandleKeyboard) return

      // Check for IME composition
      if (event.nativeEvent.isComposing || event.keyCode === 229) return

      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault()
          store.highlightNext()
          break
        }
        case 'ArrowUp': {
          event.preventDefault()
          store.highlightPrev()
          break
        }
        case 'Enter': {
          event.preventDefault()
          store.selectHighlighted()
          break
        }
        case 'ArrowRight': {
          // Open submenu if highlighted item is a submenu trigger
          if (store.isHighlightedSubmenuTrigger()) {
            event.preventDefault()
            store.openSubmenuForHighlighted()
          }
          break
        }
        case 'ArrowLeft': {
          // Close submenu and return to parent (only if in a submenu)
          if (depth > 0 && submenuContext) {
            event.preventDefault()
            submenuContext.setOpen(false)
          }
          break
        }
        case 'Home': {
          event.preventDefault()
          // Highlight first item - use highlightNext from null state
          store.setHighlightedId(null)
          store.highlightNext()
          break
        }
        case 'End': {
          event.preventDefault()
          // Highlight last item - use highlightPrev from null state
          store.setHighlightedId(null)
          store.highlightPrev()
          break
        }
      }
    },
    [onKeyDown, shouldHandleKeyboard, store, depth, submenuContext],
  )

  // Prevent pointer down from stealing focus from Input
  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      onPointerDown?.(event)
    },
    [onPointerDown],
  )

  const childrenState: DropdownMenuListChildrenState = React.useMemo(
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

export namespace DropdownMenuList {
  export type State = DropdownMenuListState
  export type ChildrenState = DropdownMenuListChildrenState
  export interface Props extends DropdownMenuListProps {}
}
