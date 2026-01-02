import * as React from 'react'
import type { FocusOwnerContextValue } from '../types.js'

// ============================================================================
// Context
// ============================================================================

/**
 * Focus owner context tracks which surface currently owns DOM focus.
 * This is provided at the Root level and shared across all surfaces.
 */
const FocusOwnerContext = React.createContext<FocusOwnerContextValue | null>(
  null,
)

FocusOwnerContext.displayName = 'FocusOwnerContext'

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access the focus owner context.
 * Throws if used outside of the Root component.
 */
export function useFocusOwner(): FocusOwnerContextValue {
  const context = React.useContext(FocusOwnerContext)
  if (!context) {
    throw new Error('useFocusOwner must be used within a Menu.Root')
  }
  return context
}

/**
 * Hook to access the focus owner context, or null if not in a provider.
 */
export function useFocusOwnerOptional(): FocusOwnerContextValue | null {
  return React.useContext(FocusOwnerContext)
}

// ============================================================================
// Exports
// ============================================================================

export { FocusOwnerContext }
