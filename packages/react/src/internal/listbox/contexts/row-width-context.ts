'use client'

import * as React from 'react'

/**
 * Context value for row width measurement.
 * Provided by List when `measureRowWidth` is enabled.
 */
export interface RowWidthContextValue {
  /**
   * Queue a row element for width measurement.
   * Call this when a row mounts or becomes visible.
   *
   * @param element - The DOM element to measure
   * @param id - Unique identifier for this row (used to avoid re-measuring)
   */
  queueMeasurement: (element: HTMLElement, id: string) => void
}

/**
 * Context for row width measurement.
 * Items use this to self-register for measurement.
 */
export const RowWidthContext = React.createContext<RowWidthContextValue | null>(
  null,
)

if (process.env.NODE_ENV !== 'production') {
  RowWidthContext.displayName = 'RowWidthContext'
}

/**
 * Hook to get the row width context.
 * Throws an error if used outside of a List with `measureRowWidth` enabled.
 */
export function useRowWidthContext(): RowWidthContextValue {
  const context = React.useContext(RowWidthContext)
  if (!context) {
    throw new Error(
      'useRowWidthContext must be used within a List with measureRowWidth enabled',
    )
  }
  return context
}

/**
 * Hook to optionally get the row width context.
 * Returns null if not within a List with `measureRowWidth` enabled.
 * This is the preferred hook for items that should work both with and without measurement.
 */
export function useMaybeRowWidthContext(): RowWidthContextValue | null {
  return React.useContext(RowWidthContext)
}
