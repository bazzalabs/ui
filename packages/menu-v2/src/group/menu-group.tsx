'use client'

import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'
import {
  MenuGroupContext,
  type MenuGroupContextValue,
} from './menu-group-context.js'

/**
 * State for the MenuGroup component
 */
export interface MenuGroupState extends Record<string, unknown> {}

/**
 * Props for the MenuGroup component
 */
export interface MenuGroupProps
  extends Omit<React.ComponentPropsWithRef<'div'>, 'className'> {
  /**
   * The content of the group.
   */
  children?: React.ReactNode
  /**
   * A function to customize the rendered element.
   */
  render?:
    | React.ReactElement
    | ((
        props: React.HTMLAttributes<HTMLDivElement>,
        state: MenuGroupState,
      ) => React.ReactElement)
  /**
   * Class name or function that returns a class name based on state.
   */
  className?: string | ((state: MenuGroupState) => string)
}

export namespace MenuGroup {
  export type State = MenuGroupState
  export type Props = MenuGroupProps
}

/**
 * Groups menu items together.
 * Can be labelled with a MenuGroupHeading.
 *
 * Renders a `<div>` element with `role="group"`.
 */
export const MenuGroup = React.forwardRef<HTMLDivElement, MenuGroup.Props>(
  function MenuGroup(props, forwardedRef) {
    const { children, render, className, ...otherProps } = props

    const [headingId, setHeadingId] = React.useState<string | undefined>(
      undefined,
    )

    const state: MenuGroup.State = React.useMemo(() => ({}), [])

    const contextValue = React.useMemo<MenuGroupContextValue>(
      () => ({
        headingId,
        setHeadingId,
      }),
      [headingId],
    )

    const resolvedClassName =
      typeof className === 'function' ? className(state) : className

    const element = useRender<MenuGroupState, HTMLDivElement>({
      render: render as useRender.RenderProp<MenuGroupState> | undefined,
      state,
      props: {
        ...otherProps,
        className: resolvedClassName,
        role: 'group',
        'aria-labelledby': headingId,
        children,
      },
      ref: forwardedRef,
      defaultTagName: 'div',
    })

    return (
      <MenuGroupContext.Provider value={contextValue}>
        {element}
      </MenuGroupContext.Provider>
    )
  },
)

MenuGroup.displayName = 'MenuGroup'
