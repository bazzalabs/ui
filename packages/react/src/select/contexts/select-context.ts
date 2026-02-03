'use client'

import * as React from 'react'
import type { ItemEqualityComparer } from '../../utils/item-equality.js'

// ============================================================================
// Select Context
// ============================================================================
// Provides value management and form integration for Select components.
// Separate from PopupMenuContext to handle Select-specific concerns.

/**
 * Item text registry for displaying selected values.
 * Maps serialized item value to its text content.
 */
export type ItemTextRegistry = Map<string, string>

/**
 * Context value for Select components.
 * Provides value state, callbacks, and form integration.
 *
 * @template Value - The type of the select value (can be a primitive or object)
 */
export interface SelectContextValue<Value = unknown> {
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
   * Custom comparison logic used to determine if a select item value
   * matches the current selected value.
   * Useful when item values are objects without matching referentially.
   * Defaults to Object.is comparison.
   */
  isItemEqualToValue: ItemEqualityComparer<Value>
  /**
   * When the item values are objects, this function converts the object
   * value to a string representation for display in the trigger.
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

  // ===== Positioner Callback Registration =====
  /** Register a callback to reset positioning state after close animation */
  registerResetPositioningCallback: (
    callback: (() => void) | null,
  ) => () => void
}

const SelectContext = React.createContext<SelectContextValue<unknown> | null>(
  null,
)

/**
 * Hook to access the Select context.
 * Throws if used outside a Select.Root.
 */
export function useSelectContext<Value = unknown>(): SelectContextValue<Value> {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error('Select components must be used within a Select.Root')
  }
  return context as SelectContextValue<Value>
}

/**
 * Hook to optionally access the Select context.
 * Returns null if used outside a Select.Root.
 */
export function useMaybeSelectContext<
  Value = unknown,
>(): SelectContextValue<Value> | null {
  return React.useContext(SelectContext) as SelectContextValue<Value> | null
}

export { SelectContext }
