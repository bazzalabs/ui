'use client'

import * as React from 'react'

// ============================================================================
// Select Context
// ============================================================================
// Provides value management and form integration for Select components.
// Separate from PopupMenuContext to handle Select-specific concerns.

/**
 * Item text registry for displaying selected values.
 * Maps item value to its text content.
 */
export type ItemTextRegistry = Map<string, string>

/**
 * Context value for Select components.
 * Provides value state, callbacks, and form integration.
 */
export interface SelectContextValue {
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

  // ===== Form Integration =====
  /** Form field name for submission */
  name?: string
  /** Associate with a form by ID */
  form?: string
  /** Whether this field is required */
  required?: boolean
  /** Whether the select is disabled */
  disabled: boolean
  /** Placeholder text when no value selected */
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
  /** Ref to the trigger element */
  triggerRef: React.RefObject<HTMLElement | null>
  /** Ref to the value display element (text in trigger) */
  valueRef: React.RefObject<HTMLElement | null>
  /** Ref to the selected item's text element */
  selectedItemTextRef: React.MutableRefObject<HTMLElement | null>
  /** Callback to set the trigger element */
  setTriggerElement: (element: HTMLElement | null) => void
  /** Callback to set the value element */
  setValueElement: (element: HTMLElement | null) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

/**
 * Hook to access the Select context.
 * Throws if used outside a Select.Root.
 */
export function useSelectContext(): SelectContextValue {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error('Select components must be used within a Select.Root')
  }
  return context
}

/**
 * Hook to optionally access the Select context.
 * Returns null if used outside a Select.Root.
 */
export function useMaybeSelectContext(): SelectContextValue | null {
  return React.useContext(SelectContext)
}

export { SelectContext }
