'use client'

import * as React from 'react'
import { useSelectContext } from '../contexts/select-context.js'

export interface SelectValueState {
  /**
   * The currently selected value (single-select mode).
   */
  value: string
  /**
   * The currently selected values (multi-select mode).
   */
  values: string[]
  /**
   * Whether the select is in multi-select mode.
   */
  multiple: boolean
  /**
   * Whether a value is currently selected.
   */
  hasValue: boolean
  /**
   * The placeholder text.
   */
  placeholder: string
  /**
   * Get the display content for a value.
   * First checks the item text registry (populated when items mount),
   * then falls back to the `items` prop passed to SelectRoot.
   */
  getValueText: (value: string) => React.ReactNode | undefined
}

export interface SelectValueProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /**
   * Placeholder text when no value is selected.
   * Overrides the placeholder set on Select.Root.
   */
  placeholder?: string

  /**
   * Custom render function for the selected value.
   * Receives the current state and should return the element to render.
   */
  children?: React.ReactNode | ((state: SelectValueState) => React.ReactNode)
}

/**
 * Displays the currently selected value(s) or placeholder.
 * Typically placed inside Select.Trigger.
 * Renders a `<span>` element.
 */
export const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  function SelectValue(props, forwardedRef) {
    const { placeholder: placeholderProp, children, ...rest } = props

    const selectContext = useSelectContext()

    const placeholder = placeholderProp ?? selectContext.placeholder

    const hasValue = selectContext.multiple
      ? selectContext.values.length > 0
      : selectContext.value !== ''

    // Helper to get text for a value
    // First check the item text registry (populated when items mount),
    // then fall back to the items prop (available immediately for initial render)
    const getValueText = React.useCallback(
      (value: string): React.ReactNode | undefined => {
        // First try the registry (populated when items mount)
        const registryText = selectContext.itemTextRegistry.get(value)
        if (registryText !== undefined) {
          return registryText
        }

        // Fall back to the items prop (for initial render before popup opens)
        const items = selectContext.items
        if (!items) {
          return undefined
        }

        // Handle record format: { value: label }
        if (!Array.isArray(items)) {
          return items[value]
        }

        // Handle array format: [{ value, label }]
        const item = items.find((item) => item.value === value)
        return item?.label
      },
      [selectContext.itemTextRegistry, selectContext.items],
    )

    const state: SelectValueState = {
      value: selectContext.value,
      values: selectContext.values,
      multiple: selectContext.multiple,
      hasValue,
      placeholder,
      getValueText,
    }

    // Determine what to render
    let content: React.ReactNode

    if (typeof children === 'function') {
      // Custom render function
      content = children(state)
    } else if (children !== undefined) {
      // Static children
      content = children
    } else if (!hasValue) {
      // Show placeholder when no value
      content = placeholder
    } else if (selectContext.multiple) {
      // Multi-select: show count or comma-separated values
      // getValueText already falls back to labels prop, then raw value
      const texts = selectContext.values
        .map((v) => getValueText(v) ?? v)
        .filter(Boolean)
      content = texts.length > 2 ? `${texts.length} selected` : texts.join(', ')
    } else {
      // Single-select: show value text
      // getValueText falls back to labels prop, then raw value
      content = getValueText(selectContext.value) ?? selectContext.value
    }

    // Register value element for positioning
    const mergedRef = React.useCallback(
      (node: HTMLSpanElement | null) => {
        selectContext.setValueElement(node)
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
      },
      [forwardedRef, selectContext],
    )

    return (
      <span ref={mergedRef} {...rest}>
        {content}
      </span>
    )
  },
)

export namespace SelectValue {
  export interface Props extends SelectValueProps {}
  export type State = SelectValueState
}
