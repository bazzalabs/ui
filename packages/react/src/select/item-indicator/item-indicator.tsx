'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { useSelectItemContext } from '../item/item-context.js'
import { SelectItemIndicatorDataAttributes } from './item-indicator.data-attrs.js'

export { SelectItemIndicatorDataAttributes }

export interface SelectItemIndicatorState extends Record<string, unknown> {
  /**
   * Whether the item is selected.
   */
  selected: boolean
}

export interface SelectItemIndicatorProps
  extends Omit<ComponentProps<'span', SelectItemIndicator.State>, 'children'> {
  /**
   * Whether to force render even when the item is not selected.
   * @default false
   */
  forceMount?: boolean

  /**
   * Whether to keep the element mounted even when not selected.
   * Unlike forceMount, this still conditionally renders children.
   * Useful for checkbox-style indicators where the container is always visible.
   * @default false
   */
  keepMounted?: boolean

  /**
   * Content to render. Can be a ReactNode or a function that receives state.
   */
  children?:
    | React.ReactNode
    | ((state: SelectItemIndicator.State) => React.ReactNode)
}

const stateAttributesMapping = {
  selected: (value: unknown): Record<string, string> | null =>
    value ? { [SelectItemIndicatorDataAttributes.selected]: '' } : null,
}

/**
 * Indicator that shows when the item is selected.
 * Typically renders a checkmark icon.
 * Only renders when the item is selected (unless forceMount or keepMounted is true).
 * Renders a `<span>` element.
 */
export const SelectItemIndicator = React.forwardRef<
  HTMLSpanElement,
  SelectItemIndicator.Props
>(function SelectItemIndicator(props, forwardedRef) {
  const {
    render,
    className,
    style,
    forceMount = false,
    keepMounted = false,
    children,
    ...rest
  } = props

  const itemContext = useSelectItemContext()
  const selected = itemContext.selected

  const state: SelectItemIndicator.State = React.useMemo(
    () => ({ selected }),
    [selected],
  )

  // Determine if we should render
  const shouldRender = forceMount || keepMounted || selected

  // For keepMounted, only render children when selected
  const content =
    typeof children === 'function'
      ? children(state)
      : keepMounted && !selected
        ? null
        : children

  const element = useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      [SelectItemIndicatorDataAttributes.slot]: '',
      'aria-hidden': true,
      className,
      style,
      children: content,
    },
    defaultTagName: 'span',
  })

  if (!shouldRender) {
    return null
  }

  return element
})

export namespace SelectItemIndicator {
  export interface Props extends SelectItemIndicatorProps {}
  export type State = SelectItemIndicatorState
}
