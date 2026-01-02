'use client'

import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'

/**
 * State for the MenuHeader component
 */
export interface MenuHeaderState extends Record<string, unknown> {}

/**
 * Props for the MenuHeader component
 */
export interface MenuHeaderProps
  extends Omit<React.ComponentPropsWithRef<'div'>, 'className'> {
  /**
   * The content of the header.
   */
  children?: React.ReactNode
  /**
   * A function to customize the rendered element.
   */
  render?:
    | React.ReactElement
    | ((
        props: React.HTMLAttributes<HTMLDivElement>,
        state: MenuHeaderState,
      ) => React.ReactElement)
  /**
   * Class name or function that returns a class name based on state.
   */
  className?: string | ((state: MenuHeaderState) => string)
}

export namespace MenuHeader {
  export type State = MenuHeaderState
  export type Props = MenuHeaderProps
}

/**
 * A header section for the menu surface.
 * Typically used for titles, search inputs, or other non-interactive content
 * that should appear above the menu items.
 *
 * Renders a `<div>` element.
 */
export const MenuHeader = React.forwardRef<HTMLDivElement, MenuHeader.Props>(
  function MenuHeader(props, forwardedRef) {
    const { children, render, className, ...otherProps } = props

    const state: MenuHeader.State = React.useMemo(() => ({}), [])

    const resolvedClassName =
      typeof className === 'function' ? className(state) : className

    const element = useRender<MenuHeaderState, HTMLDivElement>({
      render: render as useRender.RenderProp<MenuHeaderState> | undefined,
      state,
      props: {
        ...otherProps,
        className: resolvedClassName,
        children,
      },
      ref: forwardedRef,
      defaultTagName: 'div',
    })

    return element
  },
)

MenuHeader.displayName = 'MenuHeader'
