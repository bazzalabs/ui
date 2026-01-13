'use client'

import * as React from 'react'
import type { ComboboxContextValue } from '../contexts/combobox-context.js'

/**
 * Helper to resolve label from items prop
 */
function resolveLabelFromItems(
  items:
    | Record<string, React.ReactNode>
    | Array<{ value: string; label: React.ReactNode }>
    | undefined,
  value: string,
): string | undefined {
  if (!items) return undefined

  if (Array.isArray(items)) {
    const item = items.find((i) => i.value === value)
    const label = item?.label
    return typeof label === 'string' ? label : undefined
  }

  const label = items[value]
  return typeof label === 'string' ? label : undefined
}

export interface UseComboboxDisplayValueParams {
  comboboxContext: ComboboxContextValue
  open: boolean
}

export interface UseComboboxDisplayValueReturn {
  /** Whether a value is selected */
  hasValue: boolean
  /** The value to display in the input */
  displayValue: string
  /** The label of the selected value(s) */
  selectedLabel: string
  /** Get the display text for a value */
  getValueText: (value: string) => string | undefined
}

/**
 * Hook to compute the display value for the combobox input.
 *
 * Handles:
 * - Determining if a value is selected (single or multi-select)
 * - Computing the display label for selected values
 * - Switching between selected label (closed) and input value (open)
 */
export function useComboboxDisplayValue(
  params: UseComboboxDisplayValueParams,
): UseComboboxDisplayValueReturn {
  const { comboboxContext, open } = params

  // Determine if showing placeholder (no value selected)
  const hasValue = comboboxContext.multiple
    ? comboboxContext.values.length > 0
    : comboboxContext.value !== ''

  // Get the display text for selected value
  const getValueText = React.useCallback(
    (value: string): string | undefined => {
      // First try the registry (populated when items mount)
      const registryText = comboboxContext.itemTextRegistry.get(value)
      if (registryText !== undefined) {
        return registryText
      }

      // Fall back to the items prop (for initial render before popup opens)
      return resolveLabelFromItems(comboboxContext.items, value)
    },
    [comboboxContext.itemTextRegistry, comboboxContext.items],
  )

  // Get the label for the selected value (used when closed or just opened)
  const selectedLabel = React.useMemo(() => {
    if (!hasValue) {
      return ''
    }
    if (comboboxContext.multiple) {
      // For multi-select, show comma-separated values or count
      const texts = comboboxContext.values
        .map((v) => getValueText(v) ?? v)
        .filter(Boolean)
      if (texts.length <= 2) {
        return texts.join(', ')
      }
      return `${texts.length} selected`
    }
    // Single-select: show the value's text
    return getValueText(comboboxContext.value) ?? comboboxContext.value
  }, [
    hasValue,
    comboboxContext.multiple,
    comboboxContext.value,
    comboboxContext.values,
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
