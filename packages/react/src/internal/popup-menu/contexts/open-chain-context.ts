'use client'

import type { OpenChainStore } from '../store/OpenChainStore.js'
import { useMaybeMenuTree } from './menu-tree-context.js'

// ============================================================================
// Open Chain
// ============================================================================

// The menu tree's open submenu chain (`MenuTreeStore.openChain`).
export function useOpenChain(): OpenChainStore {
  const tree = useMaybeMenuTree()
  if (!tree) {
    throw new Error(
      'OpenChain components must be used within an OpenChainProvider',
    )
  }
  return tree.openChain
}
