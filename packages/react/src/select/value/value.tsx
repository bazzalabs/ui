'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import {
  resolveLabel,
  stringifyAsValue,
} from '../../utils/resolve-value-label.js'
import type { ComponentProps } from '../../utils/types.js'
import { useSelectContext } from '../contexts/select-context.js'
import { SelectValueDataAttributes } from './value.data-attrs.js'

export { SelectValueDataAttributes }

export interface SelectValueState<Value = unknown>
  extends Record<string, unknown> {
  /**
   * The currently selected value (single-select mode).
   */
  value: Value | null
  /**
   * The currently selected values (multi-select mode).
   */
  values: Value[]
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
   * then falls back to the `items` prop passed to SelectRoot,
   * then falls back to `itemToStringLabel` for object values.
   */
  getValueText: (value: Value) => React.ReactNode | undefined
}

export interface SelectValueProps<Value = unknown>
  extends Omit<ComponentProps<'span', SelectValueState<Value>>, 'children'> {
  /**
   * Placeholder text when no value is selected.
   * Overrides the placeholder set on Select.Root.
   */
  placeholder?: string

  /**
   * Custom render function for the selected value content.
   * Receives the current state and should return the content to render.
   * This is different from the `render` prop which replaces the element.
   */
  children?:
    | React.ReactNode
    | ((state: SelectValueState<Value>) => React.ReactNode)
}

const stateAttributesMapping = {
  hasValue: (value: unknown): Record<string, string> | null =>
    !value ? { [SelectValueDataAttributes.placeholder]: '' } : null,
  multiple: (value: unknown): Record<string, string> | null =>
    value ? { [SelectValueDataAttributes.multiple]: '' } : null,
  // Exclude function from data attributes to avoid hydration mismatch
  getValueText: () => null,
}

/**
 * Displays the currently selected value(s) or placeholder.
 * Typically placed inside Select.Trigger.
 * Renders a `<span>` element.
 */
function SelectValueImpl<Value = unknown>(
  props: SelectValueProps<Value>,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const {
    render,
    className,
    style,
    placeholder: placeholderProp,
    children,
    ...rest
  } = props

  const selectContext = useSelectContext<Value>()

  const placeholder = placeholderProp ?? selectContext.placeholder

  const hasValue = selectContext.multiple
    ? selectContext.values.length > 0
    : Boolean(selectContext.value)

  // Helper to get text for a value
  // First check the item text registry (populated when items mount),
  // then fall back to the items prop (available immediately for initial render),
  // then fall back to itemToStringLabel for object values
  const getValueText = React.useCallback(
    (value: Value): React.ReactNode | undefined => {
      // Serialize for registry lookup
      const serializedValue = stringifyAsValue(
        value,
        selectContext.itemToStringValue,
      )

      // First try the registry (populated when items mount)
      const registryText = selectContext.itemTextRegistry.get(serializedValue)
      if (registryText !== undefined) {
        return registryText
      }

      // Fall back to the items prop (for initial render before popup opens)
      const items = selectContext.items
      if (items) {
        // Handle record format: { value: label }
        if (!Array.isArray(items)) {
          const label = items[serializedValue]
          if (label !== undefined) {
            return label
          }
        } else {
          // Handle array format: [{ value, label }]
          const item = items.find((item) => item.value === serializedValue)
          if (item?.label !== undefined) {
            return item.label
          }
        }
      }

      // Fall back to itemToStringLabel for object values
      const resolvedLabel = resolveLabel(value, selectContext.itemToStringLabel)
      // Only return if it's different from the serialized value (meaning we got a real label)
      if (resolvedLabel && resolvedLabel !== serializedValue) {
        return resolvedLabel
      }

      return undefined
    },
    [
      selectContext.itemTextRegistry,
      selectContext.items,
      selectContext.itemToStringLabel,
      selectContext.itemToStringValue,
    ],
  )

  const state: SelectValueState<Value> = React.useMemo(
    () => ({
      value: selectContext.value,
      values: selectContext.values,
      multiple: selectContext.multiple,
      hasValue,
      placeholder,
      getValueText,
    }),
    [
      selectContext.value,
      selectContext.values,
      selectContext.multiple,
      hasValue,
      placeholder,
      getValueText,
    ],
  )

  // Determine what to render as content
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
    const texts = selectContext.values
      .map((v) => {
        const text = getValueText(v)
        if (text !== undefined) return text
        // Fall back to resolved label or serialized value
        return (
          resolveLabel(v, selectContext.itemToStringLabel) ||
          stringifyAsValue(v, selectContext.itemToStringValue)
        )
      })
      .filter(Boolean)
    content = texts.length > 2 ? `${texts.length} selected` : texts.join(', ')
  } else {
    // Single-select: show value text
    const value = selectContext.value
    if (value != null) {
      const text = getValueText(value)
      if (text !== undefined) {
        content = text
      } else {
        // Fall back to resolved label or serialized value
        content =
          resolveLabel(value, selectContext.itemToStringLabel) ||
          stringifyAsValue(value, selectContext.itemToStringValue)
      }
    }
  }

  // Register value element for positioning
  const internalRef = React.useCallback(
    (node: HTMLSpanElement | null) => {
      selectContext.setValueElement(node)
    },
    [selectContext],
  )

  return useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      [SelectValueDataAttributes.slot]: '',
      ref: internalRef,
      className,
      style,
      children: content,
    },
    defaultTagName: 'span',
  })
}

export const SelectValue = React.forwardRef(SelectValueImpl) as <
  Value = unknown,
>(
  props: SelectValueProps<Value> & React.RefAttributes<HTMLSpanElement>,
) => React.ReactElement

export namespace SelectValue {
  // Props uses unknown default for simpler usage when type doesn't matter
  export interface Props extends SelectValueProps<unknown> {}
  export type State = SelectValueState<unknown>
}
