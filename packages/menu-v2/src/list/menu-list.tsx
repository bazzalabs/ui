'use client'

import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'
import { useMenuRootContext } from '../root/menu-root-context.js'
import { useMenuSurfaceContext } from '../surface/menu-surface-context.js'

/**
 * State for the MenuList component
 */
export interface MenuListState extends Record<string, unknown> {
  /** Whether the list is empty */
  empty: boolean
}

/**
 * Props for the MenuList component
 */
export interface MenuListProps
  extends Omit<React.ComponentPropsWithRef<'div'>, 'className'> {
  /**
   * The content of the list.
   */
  children?: React.ReactNode
  /**
   * A function to customize the rendered element.
   */
  render?:
    | React.ReactElement
    | ((
        props: React.HTMLAttributes<HTMLDivElement>,
        state: MenuListState,
      ) => React.ReactElement)
  /**
   * Class name or function that returns a class name based on state.
   */
  className?: string | ((state: MenuListState) => string)
}

export namespace MenuList {
  export type State = MenuListState
  export type Props = MenuListProps
}

/**
 * Contains the menu items.
 * Provides the listbox role for accessibility.
 *
 * Renders a `<div>` element with `role="listbox"`.
 */
export const MenuList = React.forwardRef<HTMLDivElement, MenuList.Props>(
  function MenuList(props, forwardedRef) {
    const { children, render, className, ...otherProps } = props

    const { store } = useMenuRootContext()
    const { listId, surfaceId } = useMenuSurfaceContext()

    // Get active ID for this surface
    const activeId = store.useState('activeId', surfaceId)

    // Track if list is empty
    const order = store.useState('order')
    const isEmpty = order.length === 0

    // Store the list ref in context
    const listRef = React.useRef<HTMLDivElement | null>(null)
    React.useEffect(() => {
      // Update the context ref
      const contextRef = store.context.listRef
      if (contextRef && 'current' in contextRef) {
        ;(contextRef as React.MutableRefObject<HTMLDivElement | null>).current =
          listRef.current
      }
    }, [store.context.listRef])

    // Prevent pointerdown from stealing focus from the input
    const handlePointerDown = React.useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        event.preventDefault()
      },
      [],
    )

    const state: MenuList.State = React.useMemo(
      () => ({
        empty: isEmpty,
      }),
      [isEmpty],
    )

    const resolvedClassName =
      typeof className === 'function' ? className(state) : className

    const element = useRender<MenuListState, HTMLDivElement>({
      render: render as useRender.RenderProp<MenuListState> | undefined,
      state,
      props: {
        ...otherProps,
        className: resolvedClassName,
        id: listId,
        role: 'listbox',
        'aria-activedescendant': activeId ?? undefined,
        'data-empty': isEmpty ? '' : undefined,
        onPointerDown: handlePointerDown,
        children,
      },
      ref: (node: HTMLDivElement | null) => {
        listRef.current = node
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
      },
      defaultTagName: 'div',
    })

    return element
  },
)

MenuList.displayName = 'MenuList'
