'use client'

import * as React from 'react'
import { useSelectItemContext } from '../item/item-context.js'
import { SelectItemIndicatorDataAttributes } from './item-indicator.data-attrs.js'

export interface SelectItemIndicatorState {
  /**
   * Whether the item is selected.
   */
  selected: boolean
}

export interface SelectItemIndicatorProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
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
    | ((state: SelectItemIndicatorState) => React.ReactNode)
}

/**
 * Indicator that shows when the item is selected.
 * Typically renders a checkmark icon.
 * Only renders when the item is selected (unless forceMount or keepMounted is true).
 * Renders a `<span>` element.
 */
export const SelectItemIndicator = React.forwardRef<
  HTMLSpanElement,
  SelectItemIndicatorProps
>(function SelectItemIndicator(props, forwardedRef) {
  const { forceMount = false, keepMounted = false, children, ...rest } = props

  const itemContext = useSelectItemContext()
  const selected = itemContext.selected

  const state: SelectItemIndicatorState = { selected }

  // Don't render if not selected (unless forceMount or keepMounted)
  if (!forceMount && !keepMounted && !selected) {
    return null
  }

  // For keepMounted, only render children when selected
  const content =
    typeof children === 'function'
      ? children(state)
      : keepMounted && !selected
        ? null
        : children

  return (
    <span
      ref={forwardedRef}
      aria-hidden="true"
      {...(selected && { [SelectItemIndicatorDataAttributes.selected]: '' })}
      {...rest}
    >
      {content}
    </span>
  )
})

export namespace SelectItemIndicator {
  export interface Props extends SelectItemIndicatorProps {}
  export type State = SelectItemIndicatorState
}
