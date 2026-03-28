'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import { usePopupMenuItem } from '../../internal/popup-menu/index.js'
import {
  compareItemEquality,
  itemIncludes,
  removeItem,
} from '../../utils/item-equality.js'
import {
  resolveLabel,
  stringifyAsValue,
} from '../../utils/resolve-value-label.js'
import type { ComponentProps } from '../../utils/types.js'
import { useSelectContext } from '../contexts/select-context.js'
import { SelectItemDataAttributes } from './item.data-attrs.js'
import {
  SelectItemContext,
  type SelectItemContextValue,
} from './item-context.js'

export { SelectItemDataAttributes }

export interface SelectItemState extends Record<string, unknown> {
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

export interface SelectItemProps<Value = unknown>
  extends ComponentProps<'div', SelectItem.State> {
  /**
   * The value of this item. Required and must be unique within the Select.
   * Can be a primitive or an object.
   */
  value: Value

  /**
   * Text value to use for display in Select.Value when this item is selected.
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
    value ? { [SelectItemDataAttributes.highlighted]: '' } : null,
  disabled: (value: unknown): Record<string, string> | null =>
    value ? { [SelectItemDataAttributes.disabled]: '' } : null,
  selected: (value: unknown): Record<string, string> | null =>
    value ? { [SelectItemDataAttributes.selected]: '' } : null,
}

/**
 * Helper to resolve label from items prop (for legacy string-keyed items)
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
 * A selectable item in the select dropdown.
 * Renders a `<div>` element with role="option".
 *
 * @template Value - The type of the item value (can be a primitive or object)
 */
function SelectItemImpl<Value = unknown>(
  props: SelectItemProps<Value>,
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

  const selectContext = useSelectContext<Value>()

  // Serialize value for registry key and internal lookups
  const serializedValue = React.useMemo(
    () => stringifyAsValue(value, selectContext.itemToStringValue),
    [value, selectContext.itemToStringValue],
  )

  // Resolve label from items prop (for auto-populating textValue and keywords)
  // This works for legacy string-keyed items
  const labelFromItems = React.useMemo(
    () => resolveLabelFromItems(selectContext.items, serializedValue),
    [selectContext.items, serializedValue],
  )

  // Auto-resolve label from object value shape { label }
  const labelFromObjectValue = React.useMemo(
    () => resolveLabel(value, selectContext.itemToStringLabel),
    [value, selectContext.itemToStringLabel],
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

  // Auto-add label to keywords for search/filter
  const keywords = React.useMemo(() => {
    const labelStr =
      typeof labelFromItems === 'string'
        ? labelFromItems
        : labelFromObjectValue && labelFromObjectValue !== serializedValue
          ? labelFromObjectValue
          : undefined
    if (!labelStr) return keywordsProp
    if (!keywordsProp) return [labelStr]
    // Only add if not already included
    if (keywordsProp.includes(labelStr)) return keywordsProp
    return [...keywordsProp, labelStr]
  }, [keywordsProp, labelFromItems, labelFromObjectValue, serializedValue])

  const textRef = React.useRef<string | undefined>(textValue)

  // Track if this item is selected using custom equality
  const selected = selectContext.multiple
    ? itemIncludes(
        selectContext.values,
        value,
        selectContext.isItemEqualToValue,
      )
    : selectContext.value != null &&
      selectContext.value !== '' &&
      compareItemEquality(
        selectContext.value,
        value,
        selectContext.isItemEqualToValue,
      )

  // Determine close behavior: single-select closes, multi-select stays open
  const closeOnClick = !selectContext.multiple

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

      if (selectContext.multiple) {
        // Toggle value in array using custom equality
        const newValues = selected
          ? removeItem(
              selectContext.values,
              value,
              selectContext.isItemEqualToValue,
            )
          : [...selectContext.values, value]
        selectContext.onValuesChange(newValues)
      } else {
        // Set single value
        selectContext.onValueChange(value)
      }

      onSelect?.()
    }
    return item.registerSelect(handleSelect)
  }, [disabled, selectContext, value, selected, onSelect, item])

  // Register item text for Select.Value display
  React.useEffect(() => {
    // Use textValue if provided, otherwise extract from children
    const text = textRef.current
    if (text) {
      return selectContext.registerItemText(serializedValue, text)
    }
  }, [serializedValue, selectContext])

  // Update text ref when children might have changed (for extraction)
  React.useEffect(() => {
    if (!textValue && typeof children === 'string') {
      textRef.current = children
      selectContext.registerItemText(serializedValue, children)
    }
  }, [children, textValue, serializedValue, selectContext])

  const state: SelectItem.State = React.useMemo(
    () => ({
      highlighted: item.isHighlighted,
      disabled,
      selected,
    }),
    [item.isHighlighted, disabled, selected],
  )

  const itemContextValue: SelectItemContextValue<Value> = React.useMemo(
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
      [SelectItemDataAttributes.slot]: '',
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
    <SelectItemContext.Provider
      value={itemContextValue as SelectItemContextValue}
    >
      {element}
    </SelectItemContext.Provider>
  )
}

export const SelectItem = React.forwardRef(SelectItemImpl) as <Value = unknown>(
  props: SelectItemProps<Value> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement | null

export namespace SelectItem {
  export type State = SelectItemState
  export interface Props<Value = unknown> extends SelectItemProps<Value> {}
}
