'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import { PopupMenuRadioItemDataAttributes } from './radio-item.data-attrs.js'
import { useRadioItemContext } from './radio-item-context.js'

export interface PopupMenuRadioItemIndicatorState
  extends Record<string, unknown> {
  /**
   * Whether the parent radio item is currently selected/checked.
   */
  checked: boolean
  /**
   * Whether the parent radio item is currently highlighted.
   */
  highlighted: boolean
  /**
   * Whether the parent radio item is disabled.
   */
  disabled: boolean
}

export interface PopupMenuRadioItemIndicatorProps
  extends ComponentProps<'span', PopupMenuRadioItemIndicator.State> {
  /**
   * Whether to keep the indicator mounted in the DOM when unchecked.
   * Useful for animations.
   * @default false
   */
  keepMounted?: boolean
}

const stateAttributesMapping = {
  checked: (value: unknown): Record<string, string> | null =>
    value
      ? { [PopupMenuRadioItemDataAttributes.checked]: '' }
      : { [PopupMenuRadioItemDataAttributes.unchecked]: '' },
  disabled: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuRadioItemDataAttributes.disabled]: '' } : null,
}

/**
 * A visual indicator that shows when a RadioItem is selected.
 * Must be used within a RadioItem component.
 * Renders a `<span>` element with aria-hidden="true".
 */
export const PopupMenuRadioItemIndicator = React.forwardRef<
  HTMLSpanElement,
  PopupMenuRadioItemIndicator.Props
>(function PopupMenuRadioItemIndicator(props, forwardedRef) {
  const {
    keepMounted = false,
    render,
    className,
    style,
    children,
    ...rest
  } = props

  const { checked, highlighted, disabled } = useRadioItemContext()

  const state: PopupMenuRadioItemIndicator.State = React.useMemo(
    () => ({ checked, highlighted, disabled }),
    [checked, highlighted, disabled],
  )

  const shouldRender = keepMounted || checked

  return useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      'aria-hidden': true,
      className,
      style,
      children,
    },
    enabled: shouldRender,
    defaultTagName: 'span',
  })
})

export namespace PopupMenuRadioItemIndicator {
  export type State = PopupMenuRadioItemIndicatorState
  export interface Props extends PopupMenuRadioItemIndicatorProps {}
}
