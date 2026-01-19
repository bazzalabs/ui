'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import { usePopupMenuItem } from '../../internal/popup-menu/index.js'
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

export interface ComboboxItemProps
  extends ComponentProps<'div', ComboboxItem.State> {
  /**
   * The value of this item. Required and must be unique within the Combobox.
   */
  value: string

  /**
   * Text value to use for display in the input when this item is selected.
   * If not provided, the text content of the item will be used.
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
 * A selectable item in the combobox dropdown.
 * Renders a `<div>` element with role="option".
 */
export const ComboboxItem = React.forwardRef<
  HTMLDivElement,
  ComboboxItem.Props
>(function ComboboxItem(props, forwardedRef) {
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

  const comboboxContext = useComboboxContext()

  // Resolve label from items prop (for auto-populating textValue and keywords)
  const labelFromItems = React.useMemo(
    () => resolveLabelFromItems(comboboxContext.items, value),
    [comboboxContext.items, value],
  )

  // Auto-populate textValue: explicit prop > label from items (if string) > undefined
  const textValue = React.useMemo(() => {
    if (textValueProp !== undefined) return textValueProp
    if (typeof labelFromItems === 'string') return labelFromItems
    return undefined
  }, [textValueProp, labelFromItems])

  // Auto-add label to keywords for search/filter
  const keywords = React.useMemo(() => {
    const labelStr =
      typeof labelFromItems === 'string' ? labelFromItems : undefined
    if (!labelStr) return keywordsProp
    if (!keywordsProp) return [labelStr]
    // Only add if not already included
    if (keywordsProp.includes(labelStr)) return keywordsProp
    return [...keywordsProp, labelStr]
  }, [keywordsProp, labelFromItems])

  const textRef = React.useRef<string | undefined>(textValue)

  // Track if this item is selected
  const selected = comboboxContext.multiple
    ? comboboxContext.values.includes(value)
    : comboboxContext.value === value

  // Determine close behavior based on context setting
  const closeOnClick = comboboxContext.closeOnSelect

  const item = usePopupMenuItem({
    value,
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
        // Toggle value in array
        const newValues = selected
          ? comboboxContext.values.filter((v) => v !== value)
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
      return comboboxContext.registerItemText(value, text)
    }
  }, [value, comboboxContext])

  // Update text ref when children might have changed (for extraction)
  React.useEffect(() => {
    if (!textValue && typeof children === 'string') {
      textRef.current = children
      comboboxContext.registerItemText(value, children)
    }
  }, [children, textValue, value, comboboxContext])

  const state: ComboboxItem.State = React.useMemo(
    () => ({
      highlighted: item.isHighlighted,
      disabled,
      selected,
    }),
    [item.isHighlighted, disabled, selected],
  )

  const itemContextValue: ComboboxItemContextValue = React.useMemo(
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
    <ComboboxItemContext.Provider value={itemContextValue}>
      {element}
    </ComboboxItemContext.Provider>
  )
})

export namespace ComboboxItem {
  export type State = ComboboxItemState
  export interface Props extends ComboboxItemProps {}
}
