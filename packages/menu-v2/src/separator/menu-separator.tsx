'use client'

import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'

/**
 * State for the MenuSeparator component
 */
export interface MenuSeparatorState extends Record<string, unknown> {}

/**
 * Props for the MenuSeparator component
 */
export interface MenuSeparatorProps
  extends Omit<React.ComponentPropsWithRef<'div'>, 'className'> {
  /**
   * A function to customize the rendered element.
   */
  render?:
    | React.ReactElement
    | ((
        props: React.HTMLAttributes<HTMLDivElement>,
        state: MenuSeparatorState,
      ) => React.ReactElement)
  /**
   * Class name or function that returns a class name based on state.
   */
  className?: string | ((state: MenuSeparatorState) => string)
}

export namespace MenuSeparator {
  export type State = MenuSeparatorState
  export type Props = MenuSeparatorProps
}

/**
 * A visual separator between menu items.
 *
 * Renders a `<div>` element with `role="separator"`.
 */
export const MenuSeparator = React.forwardRef<
  HTMLDivElement,
  MenuSeparator.Props
>(function MenuSeparator(props, forwardedRef) {
  const { render, className, ...otherProps } = props

  const state: MenuSeparator.State = React.useMemo(() => ({}), [])

  const resolvedClassName =
    typeof className === 'function' ? className(state) : className

  const element = useRender<MenuSeparatorState, HTMLDivElement>({
    render: render as useRender.RenderProp<MenuSeparatorState> | undefined,
    state,
    props: {
      ...otherProps,
      className: resolvedClassName,
      role: 'separator',
      'aria-orientation': 'horizontal',
    },
    ref: forwardedRef,
    defaultTagName: 'div',
  })

  return element
})

MenuSeparator.displayName = 'MenuSeparator'
