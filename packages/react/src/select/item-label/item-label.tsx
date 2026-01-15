'use client'

import * as React from 'react'
import { useSelectContext } from '../contexts/select-context.js'
import { useSelectItemContext } from '../item/item-context.js'

export interface SelectItemLabelProps
  extends React.HTMLAttributes<HTMLSpanElement> {}

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
  SelectItemLabelProps
>(function SelectItemLabel(props, forwardedRef) {
  const { children, ...rest } = props

  const selectContext = useSelectContext()
  const itemContext = useSelectItemContext()
  const textRef = React.useRef<HTMLSpanElement | null>(null)

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
      selectContext.items,
      itemContext.value,
    )
    if (labelFromItems !== undefined) {
      return labelFromItems
    }

    if (itemContext.textValue !== undefined) {
      return itemContext.textValue
    }

    return itemContext.value
  }, [children, selectContext.items, itemContext.value, itemContext.textValue])

  // Register the text content when mounted (for Select.Value display)
  React.useEffect(() => {
    if (typeof resolvedLabel === 'string') {
      return selectContext.registerItemText(itemContext.value, resolvedLabel)
    }
  }, [resolvedLabel, selectContext, itemContext.value])

  // Register this element as the selected item text for alignItemWithTrigger positioning
  React.useLayoutEffect(() => {
    if (itemContext.selected && textRef.current) {
      selectContext.selectedItemTextRef.current = textRef.current
    }
  }, [itemContext.selected, selectContext])

  // Merge refs
  const mergedRef = React.useCallback(
    (node: HTMLSpanElement | null) => {
      textRef.current = node
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }
    },
    [forwardedRef],
  )

  return (
    <span ref={mergedRef} {...rest}>
      {resolvedLabel}
    </span>
  )
})

export namespace SelectItemLabel {
  export interface Props extends SelectItemLabelProps {}
}
