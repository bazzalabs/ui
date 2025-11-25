import * as React from 'react'
import type { FocusOwnerCtxValue } from '../types.js'

/** Focus owner context (which surface owns real DOM focus). */
const FocusOwnerCtx = React.createContext<FocusOwnerCtxValue | null>(null)

/**
 * Hook to access focus owner state from context.
 */
export const useFocusOwner = (): FocusOwnerCtxValue => {
  const ctx = React.useContext(FocusOwnerCtx)
  if (!ctx) throw new Error('FocusOwnerCtx missing')
  return ctx
}

export { FocusOwnerCtx }
