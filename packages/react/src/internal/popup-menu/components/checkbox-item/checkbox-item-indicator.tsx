'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { PopupMenuCheckboxItemDataAttributes } from './checkbox-item.data-attrs.js'
import { useCheckboxItemContext } from './checkbox-item-context.js'

export interface PopupMenuCheckboxItemIndicatorState
  extends Record<string, unknown> {
  /**
   * Whether the parent checkbox item is currently checked.
   */
  checked: boolean
  /**
   * Whether the parent checkbox item is currently highlighted.
   */
  highlighted: boolean
  /**
   * Whether the parent checkbox item is disabled.
   */
  disabled: boolean
  /**
   * Toggle the checked state without triggering closeOnClick.
   * Useful when you want clicking directly on the indicator to toggle
   * without closing the menu.
   */
  toggle: () => void
}

export interface PopupMenuCheckboxItemIndicatorProps
  extends ComponentProps<'span', PopupMenuCheckboxItemIndicator.State> {
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
      ? { [PopupMenuCheckboxItemDataAttributes.checked]: '' }
      : { [PopupMenuCheckboxItemDataAttributes.unchecked]: '' },
  disabled: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuCheckboxItemDataAttributes.disabled]: '' } : null,
}

/**
 * A visual indicator that shows when a CheckboxItem is checked.
 * Must be used within a CheckboxItem component.
 * Renders a `<span>` element with aria-hidden="true".
 */
export const PopupMenuCheckboxItemIndicator = React.forwardRef<
  HTMLSpanElement,
  PopupMenuCheckboxItemIndicator.Props
>(function PopupMenuCheckboxItemIndicator(props, forwardedRef) {
  const {
    keepMounted = false,
    render,
    className,
    style,
    children,
    ...rest
  } = props

  const { checked, highlighted, disabled, toggle } = useCheckboxItemContext()

  const state: PopupMenuCheckboxItemIndicator.State = React.useMemo(
    () => ({ checked, highlighted, disabled, toggle }),
    [checked, highlighted, disabled, toggle],
  )

  const shouldRender = keepMounted || checked

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'checkbox-item-indicator')

  return useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      'aria-hidden': true,
      className,
      style,
      children,
    },
    enabled: shouldRender,
    defaultTagName: 'span',
  })
})

export namespace PopupMenuCheckboxItemIndicator {
  export type State = PopupMenuCheckboxItemIndicatorState
  export interface Props extends PopupMenuCheckboxItemIndicatorProps {}
}
