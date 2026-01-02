'use client'

import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'

/**
 * State for the MenuFooter component
 */
export interface MenuFooterState extends Record<string, unknown> {}

/**
 * Props for the MenuFooter component
 */
export interface MenuFooterProps
  extends Omit<React.ComponentPropsWithRef<'div'>, 'className'> {
  /**
   * The content of the footer.
   */
  children?: React.ReactNode
  /**
   * A function to customize the rendered element.
   */
  render?:
    | React.ReactElement
    | ((
        props: React.HTMLAttributes<HTMLDivElement>,
        state: MenuFooterState,
      ) => React.ReactElement)
  /**
   * Class name or function that returns a class name based on state.
   */
  className?: string | ((state: MenuFooterState) => string)
}

export namespace MenuFooter {
  export type State = MenuFooterState
  export type Props = MenuFooterProps
}

/**
 * A footer section for the menu surface.
 * Typically used for actions, hints, or other content
 * that should appear below the menu items.
 *
 * Renders a `<div>` element.
 */
export const MenuFooter = React.forwardRef<HTMLDivElement, MenuFooter.Props>(
  function MenuFooter(props, forwardedRef) {
    const { children, render, className, ...otherProps } = props

    const state: MenuFooter.State = React.useMemo(() => ({}), [])

    const resolvedClassName =
      typeof className === 'function' ? className(state) : className

    const element = useRender<MenuFooterState, HTMLDivElement>({
      render: render as useRender.RenderProp<MenuFooterState> | undefined,
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

MenuFooter.displayName = 'MenuFooter'
