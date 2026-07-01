'use client'

import * as React from 'react'
import { resolveLabelFromItems } from '../../utils/items.js'
import {
  isValueEmpty,
  resolveLabel,
  stringifyAsValue,
} from '../../utils/resolve-value-label.js'
import type { ComboboxContextValue } from '../contexts/combobox-context.js'

export interface UseComboboxDisplayValueParams<Value = unknown> {
  comboboxContext: ComboboxContextValue<Value>
  open: boolean
}

export interface UseComboboxDisplayValueReturn<Value = unknown> {
  /** Whether a value is selected */
  hasValue: boolean
  /** The value to display in the input */
  displayValue: string
  /** The label of the selected value(s) */
  selectedLabel: string
  /** Get the display text for a value */
  getValueText: (value: Value) => string | undefined
}

/**
 * Hook to compute the display value for the combobox input.
 *
 * Handles:
 * - Determining if a value is selected (single or multi-select)
 * - Computing the display label for selected values
 * - Switching between selected label (closed) and input value (open)
 */
export function useComboboxDisplayValue<Value = unknown>(
  params: UseComboboxDisplayValueParams<Value>,
): UseComboboxDisplayValueReturn<Value> {
  const { comboboxContext, open } = params

  // Determine if showing placeholder (no value selected)
  const hasValue = comboboxContext.multiple
    ? comboboxContext.values.length > 0
    : !isValueEmpty(comboboxContext.value)

  // Get the display text for selected value
  const getValueText = React.useCallback(
    (value: Value): string | undefined => {
      // Serialize for registry lookup
      const serializedValue = stringifyAsValue(
        value,
        comboboxContext.itemToStringValue,
      )

      // First try the registry (populated when items mount)
      const registryText = comboboxContext.itemTextRegistry.get(serializedValue)
      if (registryText !== undefined) {
        return registryText
      }

      // Fall back to the items prop (for initial render before popup opens).
      // The input can only display strings, so ignore non-string labels here.
      const itemsLabel = resolveLabelFromItems(
        comboboxContext.items,
        serializedValue,
      )
      if (typeof itemsLabel === 'string') {
        return itemsLabel
      }

      // Fall back to itemToStringLabel for object values
      const resolvedLabel = resolveLabel(
        value,
        comboboxContext.itemToStringLabel,
      )
      // Only return if it's different from the serialized value (meaning we got a real label)
      if (resolvedLabel && resolvedLabel !== serializedValue) {
        return resolvedLabel
      }

      return undefined
    },
    [
      comboboxContext.itemTextRegistry,
      comboboxContext.items,
      comboboxContext.itemToStringLabel,
      comboboxContext.itemToStringValue,
    ],
  )

  // Get the label for the selected value (used when closed or just opened)
  const selectedLabel = React.useMemo(() => {
    if (!hasValue) {
      return ''
    }
    if (comboboxContext.multiple) {
      // For multi-select, show comma-separated values or count
      const texts = comboboxContext.values
        .map((v) => {
          const text = getValueText(v)
          if (text !== undefined) return text
          // Fall back to resolved label or serialized value
          return (
            resolveLabel(v, comboboxContext.itemToStringLabel) ||
            stringifyAsValue(v, comboboxContext.itemToStringValue)
          )
        })
        .filter(Boolean)
      if (texts.length <= 2) {
        return texts.join(', ')
      }
      return `${texts.length} selected`
    }
    // Single-select: show the value's text.
    // Empty-string values are already handled by the `!hasValue` guard above;
    // this null check also narrows `Value | null` down to `Value`.
    const value = comboboxContext.value
    if (value == null) return ''

    const text = getValueText(value)
    if (text !== undefined) return text
    // Fall back to resolved label or serialized value
    return (
      resolveLabel(value, comboboxContext.itemToStringLabel) ||
      stringifyAsValue(value, comboboxContext.itemToStringValue)
    )
  }, [
    hasValue,
    comboboxContext.multiple,
    comboboxContext.value,
    comboboxContext.values,
    comboboxContext.itemToStringLabel,
    comboboxContext.itemToStringValue,
    getValueText,
  ])

  // Determine the display value for the input
  // When closed: show selected value's text
  // When open: show the search/filter text (inputValue)
  const displayValue = React.useMemo(() => {
    if (!open) {
      // When closed, show the selected value's label
      return selectedLabel
    }
    // When open, use the input value for filtering
    return comboboxContext.inputValue
  }, [open, selectedLabel, comboboxContext.inputValue])

  return {
    hasValue,
    displayValue,
    selectedLabel,
    getValueText,
  }
}
