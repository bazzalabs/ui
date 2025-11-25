import * as React from 'react'
import type { KeyboardOptions } from '../types.js'
import { usePopupMenuStore, usePopupMenuStoreApi } from '../store/index.js'

/** Keyboard options context */
const KeyboardCtx = React.createContext<KeyboardOptions>({
  dir: 'ltr',
  vimBindings: true,
})

/**
 * Hook to access keyboard options.
 * First tries to use the store (if available), then falls back to context.
 */
export const useKeyboardOpts = (): KeyboardOptions => {
  // Try to get from store first
  let storeAvailable = false
  try {
    usePopupMenuStoreApi()
    storeAvailable = true
  } catch {
    // Store not available
  }

  // Get from store if available
  const storeKeyboard = storeAvailable
    ? usePopupMenuStore((state) => state.keyboard)
    : null

  // Fallback to context
  const ctx = React.useContext(KeyboardCtx)

  // If store is available, use it
  if (storeKeyboard) {
    return storeKeyboard
  }

  return ctx
}

export { KeyboardCtx }
