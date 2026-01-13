'use client'

import * as React from 'react'

// ============================================================================
// Types
// ============================================================================

// Types matching Base UI's positioning types
export type Side = 'top' | 'bottom' | 'left' | 'right'
export type Align = 'start' | 'center' | 'end'

/**
 * Layout mode for the combobox popup.
 * - `'floating'` - Standard dropdown positioning below/above the input
 * - `'input-embedded'` - Popup wraps around the input (macOS-style)
 */
export type ComboboxLayout = 'floating' | 'input-embedded'

/**
 * Context value for Combobox Positioner.
 * Provides alignment state for coordinating positioning behavior.
 */
export interface ComboboxPositionerContextValue {
  /**
   * The layout mode being used.
   * - `'floating'` - Standard dropdown positioning
   * - `'input-embedded'` - Popup wraps around the input
   */
  layout: ComboboxLayout

  /**
   * The side of the popup relative to the input.
   */
  side: Side

  /**
   * The alignment of the popup.
   */
  align: Align

  /**
   * Height of the input element in pixels.
   * Use this to add appropriate padding to the popup.
   */
  inputHeight: number
}

// ============================================================================
// Context
// ============================================================================

const ComboboxPositionerContext =
  React.createContext<ComboboxPositionerContextValue | null>(null)

/**
 * Hook to access the Combobox Positioner context.
 * Returns null if used outside a ComboboxPositioner.
 */
export function useComboboxPositionerContext(): ComboboxPositionerContextValue | null {
  return React.useContext(ComboboxPositionerContext)
}

export { ComboboxPositionerContext }
