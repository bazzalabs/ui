'use client'

import * as React from 'react'
import type { ItemEqualityComparer } from '../../utils/item-equality.js'
import type { ComboboxOpenChangeReason } from '../events.js'
import type { ComboboxLayout } from './combobox-positioner-context.js'

// ============================================================================
// Combobox Context
// ============================================================================
// Provides value management, input state, and form integration for Combobox.

/**
 * Filter mode for the combobox.
 * Controls how the search/filter value is determined.
 *
 * State transitions:
 * - Closed → open (no value) → { type: 'active' }
 * - Closed → open (with value) → { type: 'showAll' }
 * - Open + user types → { type: 'active' }
 * - Open → close → { type: 'frozen', search: <current> }
 */
export type ComboboxFilterMode =
  | { type: 'active' } // Normal: use inputValue for filtering
  | { type: 'showAll' } // Opened with selected value, user hasn't typed yet
  | { type: 'frozen'; search: string } // Closing: freeze to this value during exit animation

/**
 * Item text registry for displaying selected values.
 * Maps serialized item value to its text content.
 */
export type ItemTextRegistry = Map<string, string>

/**
 * Context value for Combobox components.
 * Provides value state, input state, callbacks, and form integration.
 *
 * @template Value - The type of the combobox value (can be a primitive or object)
 */
export interface ComboboxContextValue<Value = unknown> {
  // ===== Selection State =====
  /** Whether multi-select mode is enabled */
  multiple: boolean
  /** Current selected value (single-select mode) */
  value: Value | null
  /** Current selected values (multi-select mode) */
  values: Value[]
  /** Callback when value changes (single-select mode) */
  onValueChange: (value: Value) => void
  /** Callback when values change (multi-select mode) */
  onValuesChange: (values: Value[]) => void

  // ===== Object Value Support =====
  /**
   * Custom comparison logic used to determine if a combobox item value
   * matches the current selected value.
   * Useful when item values are objects without matching referentially.
   * Defaults to Object.is comparison.
   */
  isItemEqualToValue: ItemEqualityComparer<Value>
  /**
   * When the item values are objects, this function converts the object
   * value to a string representation for display in the input.
   * If the shape of the object is { value, label }, the label will be
   * used automatically without needing to specify this prop.
   */
  itemToStringLabel?: (itemValue: Value) => string
  /**
   * When the item values are objects, this function converts the object
   * value to a string representation for form submission.
   * If the shape of the object is { value, label }, the value will be
   * used automatically without needing to specify this prop.
   */
  itemToStringValue?: (itemValue: Value) => string

  // ===== Input State =====
  /** Current input value */
  inputValue: string
  /** Callback when input value changes */
  onInputValueChange: (value: string) => void

  // ===== Form Integration =====
  /** Form field name for submission */
  name?: string
  /** Associate with a form by ID */
  form?: string
  /** Whether this field is required */
  required?: boolean
  /** Whether the combobox is disabled */
  disabled: boolean
  /** Placeholder text for the input */
  placeholder: string

  // ===== Item Text Registry =====
  /** Registry of item values to their text content */
  itemTextRegistry: ItemTextRegistry
  /** Register an item's text content */
  registerItemText: (value: string, text: string) => () => void
  /**
   * Data structure of the items for label resolution.
   * Used to display labels before items mount (e.g., on initial render with defaultValue).
   * Can be a record mapping values to labels, or an array of { value, label } objects.
   */
  items?:
    | Record<string, React.ReactNode>
    | Array<{ value: string; label: React.ReactNode }>

  // ===== List ID for ARIA =====
  /** ID for the listbox element */
  listId: string

  // ===== Element Refs for Positioning =====
  /** Ref to the input element (also serves as anchor) */
  inputRef: React.RefObject<HTMLInputElement | null>
  /** Callback to set the input element */
  setInputElement: (element: HTMLInputElement | null) => void
  /** Ref to the input wrapper element (used as anchor when present) */
  inputWrapperRef: React.RefObject<HTMLElement | null>
  /** Callback to set the input wrapper element */
  setInputWrapperElement: (element: HTMLElement | null) => void

  // ===== Behavior =====
  /** Whether to close on selection (default: true for single, false for multiple) */
  closeOnSelect: boolean
  /** Whether to open on focus */
  openOnFocus: boolean
  /** Open the combobox */
  openCombobox: () => void
  /** Close the combobox with an optional reason and event */
  closeCombobox: (reason?: ComboboxOpenChangeReason, event?: Event) => void

  // ===== Filter Mode =====
  /**
   * Current filter mode for the combobox.
   * Controls how the search/filter value is determined.
   */
  filterMode: ComboboxFilterMode
  /** Set the filter mode to 'active' (normal filtering using inputValue) */
  setFilterActive: () => void

  // ===== Input Dimensions =====
  /**
   * Height of the input element in pixels.
   * Used by the positioner for input-embedded layout calculations.
   */
  inputHeight: number
  /**
   * Width of the input element in pixels.
   * Used by the positioner for input-embedded layout calculations.
   */
  inputWidth: number

  // ===== Layout =====
  /**
   * The layout mode for the combobox popup.
   * - `'floating'` - Standard dropdown positioning
   * - `'input-embedded'` - Popup wraps around the input (macOS-style)
   */
  layout: ComboboxLayout
}

const ComboboxContext =
  React.createContext<ComboboxContextValue<unknown> | null>(null)

/**
 * Hook to access the Combobox context.
 * Throws if used outside a Combobox.Root.
 */
export function useComboboxContext<
  Value = unknown,
>(): ComboboxContextValue<Value> {
  const context = React.useContext(ComboboxContext)
  if (!context) {
    throw new Error('Combobox components must be used within a Combobox.Root')
  }
  return context as ComboboxContextValue<Value>
}

/**
 * Hook to optionally access the Combobox context.
 * Returns null if used outside a Combobox.Root.
 */
export function useMaybeComboboxContext<
  Value = unknown,
>(): ComboboxContextValue<Value> | null {
  return React.useContext(ComboboxContext) as ComboboxContextValue<Value> | null
}

export { ComboboxContext }
