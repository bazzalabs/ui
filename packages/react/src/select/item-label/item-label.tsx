'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import { stringifyAsValue } from '../../utils/resolve-value-label.js'
import type { ComponentProps } from '../../utils/types.js'
import { useSelectContext } from '../contexts/select-context.js'
import { useSelectItemContext } from '../item/item-context.js'
import { SelectItemLabelDataAttributes } from './item-label.data-attrs.js'

export { SelectItemLabelDataAttributes }

export interface SelectItemLabelState extends Record<string, unknown> {
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

export interface SelectItemLabelProps
  extends ComponentProps<'span', SelectItemLabel.State> {}

/**
 * Helper to resolve label from items prop
 */
function resolveLabelFromItems(
  items:
    | Record<string, React.ReactNode>
    | Array<{ value: string; label: React.ReactNode }>
    | undefined,
  valueKey: string,
): React.ReactNode | undefined {
  if (!items) return undefined

  if (Array.isArray(items)) {
    const item = items.find((i) => i.value === valueKey)
    return item?.label
  }

  return items[valueKey]
}

/**
 * The label/text content of a Select.Item.
 *
 * When no children are provided, automatically renders the label from the
 * `items` prop passed to `Select.Root`. If children are provided, they
 * override the automatic label.
 *
 * Also captures the text for display in `Select.Value` when the item is selected,
 * and provides the text element reference for `alignItemWithTrigger` positioning.
 *
 * Renders a `<span>` element.
 */
export const SelectItemLabel = React.forwardRef<
  HTMLSpanElement,
  SelectItemLabel.Props
>(function SelectItemLabel(props, forwardedRef) {
  const { render, className, style, children, ...rest } = props

  const selectContext = useSelectContext()
  const itemContext = useSelectItemContext()
  const textRef = React.useRef<HTMLSpanElement | null>(null)

  // Serialize the item value to a string key for registry lookups
  const valueKey = stringifyAsValue(
    itemContext.value,
    selectContext.itemToStringValue,
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

    const labelFromItems = resolveLabelFromItems(selectContext.items, valueKey)
    if (labelFromItems !== undefined) {
      return labelFromItems
    }

    if (itemContext.textValue !== undefined) {
      return itemContext.textValue
    }

    return valueKey
  }, [children, selectContext.items, valueKey, itemContext.textValue])

  // Build state for render prop and className/style functions
  const state: SelectItemLabel.State = React.useMemo(
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

  // Register the text content when mounted (for Select.Value display)
  React.useEffect(() => {
    if (typeof resolvedLabel === 'string') {
      return selectContext.registerItemText(valueKey, resolvedLabel)
    }
  }, [resolvedLabel, selectContext, valueKey])

  // Merge refs - need to track for positioning AND pass to useRender
  const mergedRef = React.useCallback(
    (node: HTMLSpanElement | null) => {
      textRef.current = node

      // Register this element as the selected item text for alignItemWithTrigger positioning
      if (itemContext.selected && node) {
        selectContext.selectedItemTextRef.current = node
      }
    },
    [itemContext.selected, selectContext],
  )

  return useRender({
    render,
    ref: forwardedRef,
    state,
    props: {
      ...rest,
      [SelectItemLabelDataAttributes.slot]: '',
      ref: mergedRef,
      className,
      style,
      children: resolvedLabel,
    },
    defaultTagName: 'span',
  })
})

export namespace SelectItemLabel {
  export interface Props extends SelectItemLabelProps {}
  export type State = SelectItemLabelState
}
