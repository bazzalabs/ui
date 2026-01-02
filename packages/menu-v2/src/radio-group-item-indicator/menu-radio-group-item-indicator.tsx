'use client'

import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'
import { useMenuRadioGroupItemContext } from '../radio-group-item/menu-radio-group-item-context.js'

/**
 * State for the MenuRadioGroupItemIndicator component
 */
export interface MenuRadioGroupItemIndicatorState
  extends Record<string, unknown> {
  /** Whether the radio is checked */
  checked: boolean
}

/**
 * Props for the MenuRadioGroupItemIndicator component
 */
export interface MenuRadioGroupItemIndicatorProps
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
        state: MenuRadioGroupItemIndicatorState,
      ) => React.ReactElement)
  /**
   * Class name or function that returns a class name based on state.
   */
  className?: string | ((state: MenuRadioGroupItemIndicatorState) => string)
  /**
   * Whether to force mount the indicator even when unchecked.
   * @default false
   */
  forceMount?: boolean
}

export namespace MenuRadioGroupItemIndicator {
  export type State = MenuRadioGroupItemIndicatorState
  export type Props = MenuRadioGroupItemIndicatorProps
}

/**
 * Visual indicator for the radio state.
 * Only renders when checked (unless forceMount is true).
 *
 * Renders a `<span>` element.
 */
export const MenuRadioGroupItemIndicator = React.forwardRef<
  HTMLSpanElement,
  MenuRadioGroupItemIndicator.Props
>(function MenuRadioGroupItemIndicator(props, forwardedRef) {
  const {
    children,
    render,
    className,
    forceMount = false,
    ...otherProps
  } = props

  const { checked } = useMenuRadioGroupItemContext()

  const state: MenuRadioGroupItemIndicator.State = React.useMemo(
    () => ({
      checked,
    }),
    [checked],
  )

  const resolvedClassName =
    typeof className === 'function' ? className(state) : className

  const element = useRender<MenuRadioGroupItemIndicatorState, HTMLSpanElement>({
    render: render as
      | useRender.RenderProp<MenuRadioGroupItemIndicatorState>
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

MenuRadioGroupItemIndicator.displayName = 'MenuRadioGroupItemIndicator'
