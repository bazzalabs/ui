'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import { resolveLabelFromItems } from '../../utils/items.js'
import { stringifyAsValue } from '../../utils/resolve-value-label.js'
import type { ComponentProps } from '../../utils/types.js'
import { useComboboxContext } from '../contexts/combobox-context.js'
import { useComboboxItemContext } from '../item/item-context.js'
import { ComboboxItemLabelDataAttributes } from './item-label.data-attrs.js'

export { ComboboxItemLabelDataAttributes }

export interface ComboboxItemLabelState extends Record<string, unknown> {
  /**
   * The serialized string key for the parent item's value.
   * For object values, this is the result of `itemToStringValue` or the auto-detected `.value` property.
   */
  value: string
  /**
   * Whether the parent item is selected.
   */
  selected: boolean
  /**
   * Whether the parent item is highlighted.
   */
  highlighted: boolean
  /**
   * Whether the parent item is disabled.
   */
  disabled: boolean
}

export interface ComboboxItemLabelProps
  extends ComponentProps<'span', ComboboxItemLabel.State> {}

/**
 * Renders the text label for a combobox item.
 *
 * When no children are provided, automatically renders the label from:
 * 1. The `items` prop passed to `Combobox.Root`
 * 2. The `textValue` prop on `Combobox.Item`
 * 3. Falls back to the item's value
 *
 * Also registers the text content for use in the input display.
 * Renders a `<span>` element.
 */
export const ComboboxItemLabel = React.forwardRef<
  HTMLSpanElement,
  ComboboxItemLabel.Props
>(function ComboboxItemLabel(props, forwardedRef) {
  const { render, className, style, children, ...rest } = props

  const comboboxContext = useComboboxContext()
  const itemContext = useComboboxItemContext()

  // Serialize the item value to a string key for registry lookups
  const valueKey = stringifyAsValue(
    itemContext.value,
    comboboxContext.itemToStringValue,
  )

  // Resolve label content:
  // 1. Explicit children (override)
  // 2. Label from items prop lookup
  // 3. textValue from item context
  // 4. Fall back to the serialized value key
  const resolvedLabel = React.useMemo(() => {
    if (children !== undefined) {
      return children
    }

    const labelFromItems = resolveLabelFromItems(
      comboboxContext.items,
      valueKey,
    )
    if (labelFromItems !== undefined) {
      return labelFromItems
    }

    if (itemContext.textValue !== undefined) {
      return itemContext.textValue
    }

    return valueKey
  }, [children, comboboxContext.items, valueKey, itemContext.textValue])

  // Build state for render prop and className/style functions
  const state: ComboboxItemLabel.State = React.useMemo(
    () => ({
      value: valueKey,
      selected: itemContext.selected,
      highlighted: itemContext.highlighted,
      disabled: itemContext.disabled,
    }),
    [
      valueKey,
      itemContext.selected,
      itemContext.highlighted,
      itemContext.disabled,
    ],
  )

  // Register text content when mounted or resolved label changes
  React.useEffect(() => {
    if (typeof resolvedLabel === 'string') {
      return comboboxContext.registerItemText(valueKey, resolvedLabel)
    }
  }, [resolvedLabel, comboboxContext, valueKey])

  return useRender({
    render,
    ref: forwardedRef,
    state,
    props: {
      ...rest,
      [ComboboxItemLabelDataAttributes.slot]: '',
      className,
      style,
      children: resolvedLabel,
    },
    defaultTagName: 'span',
  })
})

export namespace ComboboxItemLabel {
  export interface Props extends ComboboxItemLabelProps {}
  export type State = ComboboxItemLabelState
}
