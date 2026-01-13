'use client'

import * as React from 'react'
import type { OpenChainStore } from '../store/OpenChainStore.js'

// ============================================================================
// Open Chain Context
// ============================================================================

const OpenChainContext = React.createContext<OpenChainStore | null>(null)

export function useOpenChain(): OpenChainStore {
  const context = React.useContext(OpenChainContext)
  if (!context) {
    throw new Error(
      'OpenChain components must be used within an OpenChainProvider',
    )
  }
  return context
}

export function useMaybeOpenChain(): OpenChainStore | null {
  return React.useContext(OpenChainContext)
}

export { OpenChainContext }
