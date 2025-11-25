import * as React from 'react'
import type { FocusOwnerCtxValue } from '../types.js'
import { usePopupMenuStore, usePopupMenuStoreApi } from '../store/index.js'

/** Focus owner context (which surface owns real DOM focus). */
const FocusOwnerCtx = React.createContext<FocusOwnerCtxValue | null>(null)

/**
 * Hook to access focus owner state.
 * First tries to use the store (if available), then falls back to context.
 */
export const useFocusOwner = (): FocusOwnerCtxValue => {
  // Try to get from store first
  let storeApi: ReturnType<typeof usePopupMenuStoreApi> | null = null
  try {
    storeApi = usePopupMenuStoreApi()
  } catch {
    // Store not available, will use context
  }

  // Get ownerId from store if available
  const storeOwnerId = storeApi
    ? usePopupMenuStore((state) => state.focus.ownerId)
    : null

  // Fallback to context
  const ctx = React.useContext(FocusOwnerCtx)

  // If store is available, use it
  if (storeApi) {
    return {
      ownerId: storeOwnerId,
      setOwnerId: (id: string | null) => {
        storeApi!.getState().setFocusOwner(id)
      },
    }
  }

  // Fall back to context
  if (!ctx) throw new Error('FocusOwnerCtx missing')
  return ctx
}

export { FocusOwnerCtx }
