'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import { usePopupMenuItem } from '../../internal/popup-menu/index.js'
import {
  compareItemEquality,
  itemIncludes,
  removeItem,
} from '../../utils/item-equality.js'
import { mergeKeywords, resolveItemFromItems } from '../../utils/items.js'
import {
  resolveLabel,
  stringifyAsValue,
} from '../../utils/resolve-value-label.js'
import type { ComponentProps } from '../../utils/types.js'
import { useComboboxContext } from '../contexts/combobox-context.js'
import { ComboboxItemDataAttributes } from './item.data-attrs.js'
import {
  ComboboxItemContext,
  type ComboboxItemContextValue,
} from './item-context.js'

export { ComboboxItemDataAttributes }

export interface ComboboxItemState extends Record<string, unknown> {
  /**
   * Whether the item is highlighted (via keyboard or pointer).
   */
  highlighted: boolean
  /**
   * Whether the item is disabled.
   */
  disabled: boolean
  /**
   * Whether the item is currently selected.
   */
  selected: boolean
}

export interface ComboboxItemProps<Value = unknown>
  extends ComponentProps<'div', ComboboxItem.State> {
  /**
   * The value of this item. Required and must be unique within the Combobox.
   * Can be a primitive or an object.
   */
  value: Value

  /**
   * Text value to use for display in the input when this item is selected.
   * If not provided, the text content of the item will be used.
   * For object values, this can be auto-detected from `{ label }` shape.
   */
  textValue?: string

  /**
   * Additional keywords to match against when filtering.
   * Useful for aliases or synonyms.
   */
  keywords?: string[]

  /**
   * Whether this item is disabled.
   * Disabled items are not selectable and are skipped during keyboard navigation.
   */
  disabled?: boolean

  /**
   * Callback when this item is selected.
   */
  onSelect?: () => void

  /**
   * Whether to force render this item regardless of filter results.
   * @default false
   */
  forceMount?: boolean
}

const stateAttributesMapping = {
  highlighted: (value: unknown): Record<string, string> | null =>
    value ? { [ComboboxItemDataAttributes.highlighted]: '' } : null,
  disabled: (value: unknown): Record<string, string> | null =>
    value ? { [ComboboxItemDataAttributes.disabled]: '' } : null,
  selected: (value: unknown): Record<string, string> | null =>
    value ? { [ComboboxItemDataAttributes.selected]: '' } : null,
}

/**
 * A selectable item in the combobox dropdown.
 * Renders a `<div>` element with role="option".
 *
 * @template Value - The type of the item value (can be a primitive or object)
 */
function ComboboxItemImpl<Value = unknown>(
  props: ComboboxItemProps<Value>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    value,
    textValue: textValueProp,
    keywords: keywordsProp,
    disabled = false,
    onSelect,
    forceMount = false,
    render,
    className,
    style,
    onClick,
    onPointerDown,
    onPointerMove,
    children,
    ...rest
  } = props

  const comboboxContext = useComboboxContext<Value>()

  // Serialize value for registry key and internal lookups
  const serializedValue = React.useMemo(
    () => stringifyAsValue(value, comboboxContext.itemToStringValue),
    [value, comboboxContext.itemToStringValue],
  )

  // Resolve the item entry (label + keywords) from the items prop, for
  // auto-populating textValue and filter keywords.
  const itemFromItems = React.useMemo(
    () => resolveItemFromItems(comboboxContext.items, serializedValue),
    [comboboxContext.items, serializedValue],
  )
  const labelFromItems = itemFromItems?.label

  // Auto-resolve label from object value shape { label }
  const labelFromObjectValue = React.useMemo(
    () => resolveLabel(value, comboboxContext.itemToStringLabel),
    [value, comboboxContext.itemToStringLabel],
  )

  // Auto-populate textValue: explicit prop > label from items (if string) > label from object > undefined
  const textValue = React.useMemo(() => {
    if (textValueProp !== undefined) return textValueProp
    if (typeof labelFromItems === 'string') return labelFromItems
    // For object values, use the resolved label
    if (labelFromObjectValue && labelFromObjectValue !== serializedValue) {
      return labelFromObjectValue
    }
    return undefined
  }, [textValueProp, labelFromItems, labelFromObjectValue, serializedValue])

  // Auto-add the label plus any items[].keywords to the filter keywords.
  const keywords = React.useMemo(() => {
    const labelStr =
      typeof labelFromItems === 'string'
        ? labelFromItems
        : labelFromObjectValue && labelFromObjectValue !== serializedValue
          ? labelFromObjectValue
          : undefined
    return mergeKeywords(keywordsProp, [
      labelStr,
      ...(itemFromItems?.keywords ?? []),
    ])
  }, [
    keywordsProp,
    labelFromItems,
    labelFromObjectValue,
    serializedValue,
    itemFromItems,
  ])

  const textRef = React.useRef<string | undefined>(textValue)

  // Track if this item is selected using custom equality
  const selected = comboboxContext.multiple
    ? itemIncludes(
        comboboxContext.values,
        value,
        comboboxContext.isItemEqualToValue,
      )
    : comboboxContext.value != null &&
      compareItemEquality(
        comboboxContext.value,
        value,
        comboboxContext.isItemEqualToValue,
      )

  // Determine close behavior based on context setting
  const closeOnClick = comboboxContext.closeOnSelect

  const item = usePopupMenuItem({
    value: serializedValue,
    keywords,
    disabled,
    forceMount,
    closeOnClick,
    children,
  })

  // Register the select handler that updates the value
  React.useEffect(() => {
    const handleSelect = () => {
      if (disabled) return

      if (comboboxContext.multiple) {
        // Toggle value in array using custom equality
        const newValues = selected
          ? removeItem(
              comboboxContext.values,
              value,
              comboboxContext.isItemEqualToValue,
            )
          : [...comboboxContext.values, value]
        comboboxContext.onValuesChange(newValues)
      } else {
        // Set single value
        comboboxContext.onValueChange(value)
      }

      onSelect?.()
    }
    return item.registerSelect(handleSelect)
  }, [disabled, comboboxContext, value, selected, onSelect, item])

  // Register item text for input display
  React.useEffect(() => {
    // Use textValue if provided, otherwise extract from children
    const text = textRef.current
    if (text) {
      return comboboxContext.registerItemText(serializedValue, text)
    }
  }, [serializedValue, comboboxContext])

  // Update text ref when children might have changed (for extraction)
  React.useEffect(() => {
    if (!textValue && typeof children === 'string') {
      textRef.current = children
      comboboxContext.registerItemText(serializedValue, children)
    }
  }, [children, textValue, serializedValue, comboboxContext])

  const state: ComboboxItem.State = React.useMemo(
    () => ({
      highlighted: item.isHighlighted,
      disabled,
      selected,
    }),
    [item.isHighlighted, disabled, selected],
  )

  const itemContextValue: ComboboxItemContextValue<Value> = React.useMemo(
    () => ({
      id: item.id,
      value,
      textValue,
      highlighted: item.isHighlighted,
      disabled,
      selected,
    }),
    [item.id, value, textValue, item.isHighlighted, disabled, selected],
  )

  // Merge user-provided handlers with item handlers
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(event)
      if (!event.defaultPrevented) {
        item.handlers.onClick(event)
      }
    },
    [onClick, item.handlers],
  )

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      item.handlers.onPointerDown(event)
      onPointerDown?.(event)
    },
    [item.handlers, onPointerDown],
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event)
      if (!event.defaultPrevented) {
        item.handlers.onPointerMove(event)
      }
    },
    [onPointerMove, item.handlers],
  )

  const element = useRender({
    render,
    ref: [item.ref, forwardedRef],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      [ComboboxItemDataAttributes.slot]: '',
      id: item.id,
      role: 'option',
      tabIndex: -1,
      'aria-selected': selected,
      'aria-disabled': disabled || undefined,
      className,
      style,
      onClick: handleClick,
      onPointerMove: handlePointerMove,
      onPointerDown: handlePointerDown,
      children,
    },
    enabled: item.isVisible,
    defaultTagName: 'div',
  })

  if (!item.isVisible) {
    return null
  }

  return (
    <ComboboxItemContext.Provider
      value={itemContextValue as ComboboxItemContextValue}
    >
      {element}
    </ComboboxItemContext.Provider>
  )
}

export const ComboboxItem = React.forwardRef(ComboboxItemImpl) as <
  Value = unknown,
>(
  props: ComboboxItemProps<Value> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement | null

export namespace ComboboxItem {
  export type State = ComboboxItemState
  export interface Props<Value = unknown> extends ComboboxItemProps<Value> {}
}
