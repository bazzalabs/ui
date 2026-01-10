'use client'

import * as React from 'react'
import type { OpenChainStore } from '../store/OpenChainStore.js'

/**
 * Context for the OpenChainStore.
 * Provides access to tracking which surfaces have been activated across the menu tree.
 */
const OpenChainCtx = React.createContext<OpenChainStore | null>(null)

/**
 * Hook to access the OpenChainStore.
 * Must be used within an OpenChainProvider.
 */
export const useOpenChain = (): OpenChainStore => {
  const store = React.useContext(OpenChainCtx)
  if (!store) {
    throw new Error('useOpenChain must be used within an OpenChainProvider')
  }
  return store
}

export { OpenChainCtx }
