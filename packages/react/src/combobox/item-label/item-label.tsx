'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { useComboboxContext } from '../contexts/combobox-context.js'
import { useComboboxItemContext } from '../item/item-context.js'

export interface ComboboxItemLabelState extends Record<string, unknown> {
  /**
   * The value of the parent item.
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
 * Helper to resolve label from items prop
 */
function resolveLabelFromItems(
  items:
    | Record<string, React.ReactNode>
    | Array<{ value: string; label: React.ReactNode }>
    | undefined,
  value: string,
): React.ReactNode | undefined {
  if (!items) return undefined

  if (Array.isArray(items)) {
    const item = items.find((i) => i.value === value)
    return item?.label
  }

  return items[value]
}

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

  // Resolve label content:
  // 1. Explicit children (override)
  // 2. Label from items prop lookup
  // 3. textValue from item context
  // 4. Fall back to item value
  const resolvedLabel = React.useMemo(() => {
    if (children !== undefined) {
      return children
    }

    const labelFromItems = resolveLabelFromItems(
      comboboxContext.items,
      itemContext.value,
    )
    if (labelFromItems !== undefined) {
      return labelFromItems
    }

    if (itemContext.textValue !== undefined) {
      return itemContext.textValue
    }

    return itemContext.value
  }, [
    children,
    comboboxContext.items,
    itemContext.value,
    itemContext.textValue,
  ])

  // Build state for render prop and className/style functions
  const state: ComboboxItemLabel.State = React.useMemo(
    () => ({
      value: itemContext.value,
      selected: itemContext.selected,
      highlighted: itemContext.highlighted,
      disabled: itemContext.disabled,
    }),
    [
      itemContext.value,
      itemContext.selected,
      itemContext.highlighted,
      itemContext.disabled,
    ],
  )

  // Register text content when mounted or resolved label changes
  React.useEffect(() => {
    if (typeof resolvedLabel === 'string') {
      return comboboxContext.registerItemText(itemContext.value, resolvedLabel)
    }
  }, [resolvedLabel, comboboxContext, itemContext.value])

  return useRender({
    render,
    ref: forwardedRef,
    state,
    props: {
      ...rest,
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
