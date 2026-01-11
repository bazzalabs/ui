'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { ItemContext } from '../contexts/item-context.js'
import { useItem } from '../utils/use-item.js'

export interface DropdownMenuItemState extends Record<string, unknown> {
  /**
   * Whether the item is highlighted (via keyboard or pointer).
   */
  highlighted: boolean
  /**
   * Whether the item is disabled.
   */
  disabled: boolean
}

export interface DropdownMenuItemProps
  extends ComponentProps<'div', DropdownMenuItemState> {
  /**
   * Unique value for this item used for filtering.
   * If not provided, will be inferred from textContent.
   */
  value?: string

  /**
   * Additional keywords to match against when filtering.
   * Useful for aliases or synonyms.
   */
  keywords?: string[]

  /**
   * Whether this item is disabled.
   * Disabled items are not selectable and are skipped during keyboard navigation.
   */
  disabled?: boolean

  /**
   * Callback when this item is selected (via click or Enter key).
   */
  onSelect?: () => void

  /**
   * Whether to force render this item regardless of filter results.
   * @default false
   */
  forceMount?: boolean

  /**
   * Whether clicking this item should close the menu.
   * @default true
   */
  closeOnClick?: boolean

  /**
   * Keyboard shortcut to trigger this item.
   * When the menu is focused and the user presses this key, the item will be selected.
   * Should be a single character (e.g., "1", "a", etc.).
   */
  shortcut?: string
}

/**
 * A selectable item in the dropdown menu.
 * Renders a `<div>` element with role="option".
 */
export const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuItemProps
>(function DropdownMenuItem(props, forwardedRef) {
  const {
    value,
    keywords,
    disabled = false,
    onSelect,
    forceMount = false,
    closeOnClick = true,
    shortcut,
    render,
    className,
    style,
    onClick,
    onPointerDown,
    onPointerMove,
    children,
    ...rest
  } = props

  const item = useItem({
    value,
    keywords,
    disabled,
    forceMount,
    shortcut,
    onSelect,
    closeOnClick,
    children,
  })

  const state: DropdownMenuItemState = React.useMemo(
    () => ({
      highlighted: item.isHighlighted,
      disabled,
    }),
    [item.isHighlighted, disabled],
  )

  // Merge user-provided handlers with item handlers
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(event)
      if (!event.defaultPrevented) {
        item.handlers.onClick(event)
      }
    },
    [onClick, item.handlers],
  )

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      item.handlers.onPointerDown(event)
      onPointerDown?.(event)
    },
    [item.handlers, onPointerDown],
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event)
      if (!event.defaultPrevented) {
        item.handlers.onPointerMove(event)
      }
    },
    [onPointerMove, item.handlers],
  )

  // Wrap children with ItemContext.Provider so child components can access item state
  const wrappedChildren = (
    <ItemContext.Provider value={item.contextValue}>
      {children}
    </ItemContext.Provider>
  )

  return useRender({
    render,
    ref: [item.ref, forwardedRef],
    state,
    props: {
      ...rest,
      id: item.id,
      role: 'option',
      tabIndex: -1,
      'aria-selected': item.isHighlighted,
      'aria-disabled': disabled || undefined,
      className,
      style,
      onClick: handleClick,
      onPointerMove: handlePointerMove,
      onPointerDown: handlePointerDown,
      children: wrappedChildren,
    },
    enabled: item.isVisible,
    defaultTagName: 'div',
  })
})

export namespace DropdownMenuItem {
  export type State = DropdownMenuItemState
  export interface Props extends DropdownMenuItemProps {}
}
