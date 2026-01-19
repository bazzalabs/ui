'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { useComboboxItemContext } from '../item/item-context.js'
import { ComboboxItemIndicatorDataAttributes } from './item-indicator.data-attrs.js'

export { ComboboxItemIndicatorDataAttributes }

export interface ComboboxItemIndicatorState extends Record<string, unknown> {
  /**
   * Whether the parent item is selected.
   */
  selected: boolean
}

export interface ComboboxItemIndicatorProps
  extends ComponentProps<'span', ComboboxItemIndicator.State> {
  /**
   * Whether to always render the indicator regardless of selection state.
   * When false (default), only renders when the item is selected.
   * @default false
   */
  keepMounted?: boolean
}

const stateAttributesMapping = {
  selected: (value: unknown): Record<string, string> | null =>
    value ? { [ComboboxItemIndicatorDataAttributes.selected]: '' } : null,
}

/**
 * Visual indicator for the selected state of a combobox item.
 * Only renders when the parent item is selected (unless keepMounted is true).
 * Renders a `<span>` element.
 */
export const ComboboxItemIndicator = React.forwardRef<
  HTMLSpanElement,
  ComboboxItemIndicator.Props
>(function ComboboxItemIndicator(props, forwardedRef) {
  const { keepMounted = false, render, className, style, ...rest } = props

  const itemContext = useComboboxItemContext()

  const state: ComboboxItemIndicator.State = React.useMemo(
    () => ({
      selected: itemContext.selected,
    }),
    [itemContext.selected],
  )

  const element = useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      'aria-hidden': true,
      className,
      style,
    },
    enabled: keepMounted || itemContext.selected,
    defaultTagName: 'span',
  })

  // Don't render if not selected and not keepMounted
  if (!keepMounted && !itemContext.selected) {
    return null
  }

  return element
})

export namespace ComboboxItemIndicator {
  export type State = ComboboxItemIndicatorState
  export interface Props extends ComboboxItemIndicatorProps {}
}
