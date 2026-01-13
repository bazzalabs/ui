'use client'

import * as React from 'react'

// Types matching Base UI's positioning types
export type Side = 'top' | 'bottom' | 'left' | 'right'
export type Align = 'start' | 'center' | 'end'

/**
 * Context value for Select Positioner.
 * Provides alignment state for coordinating positioning behavior.
 */
export interface SelectPositionerContextValue {
  /**
   * Whether alignItemWithTrigger is actively being used.
   * This may be false even if the prop is true (e.g., fallback scenarios).
   */
  alignItemWithTriggerActive: boolean

  /**
   * The rendered side of the popup (or 'none' when using align-item-with-trigger).
   */
  side: Side | 'none'

  /**
   * The rendered alignment of the popup.
   */
  align: Align

  /**
   * Ref for the scroll up arrow element.
   */
  scrollUpArrowRef: React.RefObject<HTMLDivElement | null>

  /**
   * Ref for the scroll down arrow element.
   */
  scrollDownArrowRef: React.RefObject<HTMLDivElement | null>

  /**
   * Callback to disable alignItemWithTrigger (fallback to normal positioning).
   */
  setAlignItemWithTriggerActive: (active: boolean) => void
}

const SelectPositionerContext =
  React.createContext<SelectPositionerContextValue | null>(null)

/**
 * Hook to access the Select Positioner context.
 * Returns null if used outside a SelectPositioner.
 */
export function useSelectPositionerContext(): SelectPositionerContextValue | null {
  return React.useContext(SelectPositionerContext)
}

export { SelectPositionerContext }
