'use client'

import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'
import { useMenuCheckboxItemContext } from '../checkbox-item/menu-checkbox-item-context.js'

/**
 * State for the MenuCheckboxItemIndicator component
 */
export interface MenuCheckboxItemIndicatorState
  extends Record<string, unknown> {
  /** Whether the checkbox is checked */
  checked: boolean
}

/**
 * Props for the MenuCheckboxItemIndicator component
 */
export interface MenuCheckboxItemIndicatorProps
  extends Omit<React.ComponentPropsWithRef<'span'>, 'className' | 'children'> {
  /**
   * The content to display when checked.
   */
  children?: React.ReactNode
  /**
   * A function to customize the rendered element.
   */
  render?:
    | React.ReactElement
    | ((
        props: React.HTMLAttributes<HTMLSpanElement>,
        state: MenuCheckboxItemIndicatorState,
      ) => React.ReactElement)
  /**
   * Class name or function that returns a class name based on state.
   */
  className?: string | ((state: MenuCheckboxItemIndicatorState) => string)
  /**
   * Whether to force mount the indicator even when unchecked.
   * @default false
   */
  forceMount?: boolean
}

export namespace MenuCheckboxItemIndicator {
  export type State = MenuCheckboxItemIndicatorState
  export type Props = MenuCheckboxItemIndicatorProps
}

/**
 * Visual indicator for the checkbox state.
 * Only renders when checked (unless forceMount is true).
 *
 * Renders a `<span>` element.
 */
export const MenuCheckboxItemIndicator = React.forwardRef<
  HTMLSpanElement,
  MenuCheckboxItemIndicator.Props
>(function MenuCheckboxItemIndicator(props, forwardedRef) {
  const {
    children,
    render,
    className,
    forceMount = false,
    ...otherProps
  } = props

  const { checked } = useMenuCheckboxItemContext()

  const state: MenuCheckboxItemIndicator.State = React.useMemo(
    () => ({
      checked,
    }),
    [checked],
  )

  const resolvedClassName =
    typeof className === 'function' ? className(state) : className

  const element = useRender<MenuCheckboxItemIndicatorState, HTMLSpanElement>({
    render: render as
      | useRender.RenderProp<MenuCheckboxItemIndicatorState>
      | undefined,
    state,
    props: {
      ...otherProps,
      className: resolvedClassName,
      'aria-hidden': true,
      'data-state': checked ? 'checked' : 'unchecked',
      children,
    },
    ref: forwardedRef,
    defaultTagName: 'span',
  })

  // Only render when checked or force mounted
  const shouldRender = checked || forceMount

  return shouldRender ? element : null
})

MenuCheckboxItemIndicator.displayName = 'MenuCheckboxItemIndicator'
