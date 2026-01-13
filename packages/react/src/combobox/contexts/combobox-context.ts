'use client'

import * as React from 'react'

// ============================================================================
// Combobox Context
// ============================================================================
// Provides value management, input state, and form integration for Combobox.

/**
 * Item text registry for displaying selected values.
 * Maps item value to its text content.
 */
export type ItemTextRegistry = Map<string, string>

/**
 * Context value for Combobox components.
 * Provides value state, input state, callbacks, and form integration.
 */
export interface ComboboxContextValue {
  // ===== Selection State =====
  /** Whether multi-select mode is enabled */
  multiple: boolean
  /** Current selected value (single-select mode) */
  value: string
  /** Current selected values (multi-select mode) */
  values: string[]
  /** Callback when value changes (single-select mode) */
  onValueChange: (value: string) => void
  /** Callback when values change (multi-select mode) */
  onValuesChange: (values: string[]) => void

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

  // ===== Behavior =====
  /** Whether to close on selection (default: true for single, false for multiple) */
  closeOnSelect: boolean
  /** Whether to open on focus */
  openOnFocus: boolean
  /** Open the combobox */
  openCombobox: () => void
  /** Close the combobox */
  closeCombobox: () => void

  // ===== Filter Bypass =====
  /**
   * Whether to skip filtering.
   * True when the popup just opened with a selected value and the user hasn't typed yet.
   * This allows showing all items initially even though the input shows the selected label.
   */
  skipFiltering: boolean
  /** Mark that the user has changed the query (enables filtering) */
  markQueryChanged: () => void
}

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null)

/**
 * Hook to access the Combobox context.
 * Throws if used outside a Combobox.Root.
 */
export function useComboboxContext(): ComboboxContextValue {
  const context = React.useContext(ComboboxContext)
  if (!context) {
    throw new Error('Combobox components must be used within a Combobox.Root')
  }
  return context
}

/**
 * Hook to optionally access the Combobox context.
 * Returns null if used outside a Combobox.Root.
 */
export function useMaybeComboboxContext(): ComboboxContextValue | null {
  return React.useContext(ComboboxContext)
}

export { ComboboxContext }
