'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps, HTMLProps } from '../../utils/types.js'
import { useSelectContext } from '../contexts/select-context.js'
import { SelectValueDataAttributes } from './value.data-attrs.js'

export { SelectValueDataAttributes }

export interface SelectValueState extends Record<string, unknown> {
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
  extends Omit<ComponentProps<'span', SelectValue.State>, 'children'> {
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
  children?: React.ReactNode | ((state: SelectValue.State) => React.ReactNode)
}

const stateAttributesMapping = {
  hasValue: (value: unknown): Record<string, string> | null =>
    !value ? { [SelectValueDataAttributes.placeholder]: '' } : null,
  multiple: (value: unknown): Record<string, string> | null =>
    value ? { [SelectValueDataAttributes.multiple]: '' } : null,
}

/**
 * Displays the currently selected value(s) or placeholder.
 * Typically placed inside Select.Trigger.
 * Renders a `<span>` element.
 */
export const SelectValue = React.forwardRef<HTMLSpanElement, SelectValue.Props>(
  function SelectValue(props, forwardedRef) {
    const {
      render,
      className,
      style,
      placeholder: placeholderProp,
      children,
      ...rest
    } = props

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

    const state: SelectValue.State = React.useMemo(
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
        ref: internalRef,
        className,
        style,
        children: content,
      },
      defaultTagName: 'span',
    })
  },
)

export namespace SelectValue {
  export interface Props extends SelectValueProps {}
  export type State = SelectValueState
}
