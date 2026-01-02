'use client'

import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'
import { useMenuGroupContext } from '../group/menu-group-context.js'

/**
 * State for the MenuGroupHeading component
 */
export interface MenuGroupHeadingState extends Record<string, unknown> {}

/**
 * Props for the MenuGroupHeading component
 */
export interface MenuGroupHeadingProps
  extends Omit<React.ComponentPropsWithRef<'div'>, 'className'> {
  /**
   * The content of the heading.
   */
  children?: React.ReactNode
  /**
   * A function to customize the rendered element.
   */
  render?:
    | React.ReactElement
    | ((
        props: React.HTMLAttributes<HTMLDivElement>,
        state: MenuGroupHeadingState,
      ) => React.ReactElement)
  /**
   * Class name or function that returns a class name based on state.
   */
  className?: string | ((state: MenuGroupHeadingState) => string)
}

export namespace MenuGroupHeading {
  export type State = MenuGroupHeadingState
  export type Props = MenuGroupHeadingProps
}

/**
 * A heading/label for a MenuGroup.
 *
 * Renders a `<div>` element.
 */
export const MenuGroupHeading = React.forwardRef<
  HTMLDivElement,
  MenuGroupHeading.Props
>(function MenuGroupHeading(props, forwardedRef) {
  const { children, render, className, id: idProp, ...otherProps } = props

  const groupContext = useMenuGroupContext()
  const generatedId = React.useId()
  const id = idProp ?? generatedId

  // Register heading ID with group context
  React.useEffect(() => {
    groupContext?.setHeadingId(id)
  }, [groupContext, id])

  const state: MenuGroupHeading.State = React.useMemo(() => ({}), [])

  const resolvedClassName =
    typeof className === 'function' ? className(state) : className

  const element = useRender<MenuGroupHeadingState, HTMLDivElement>({
    render: render as useRender.RenderProp<MenuGroupHeadingState> | undefined,
    state,
    props: {
      ...otherProps,
      className: resolvedClassName,
      id,
      children,
    },
    ref: forwardedRef,
    defaultTagName: 'div',
  })

  return element
})

MenuGroupHeading.displayName = 'MenuGroupHeading'
