'use client'

import type { FocusOwnerStore } from '../store/FocusOwnerStore.js'
import { useMaybeMenuTree } from './menu-tree-context.js'

// ============================================================================
// Focus Owner
// ============================================================================

// The menu tree's focus owner (`MenuTreeStore.focusOwner`).
export function useFocusOwner(): FocusOwnerStore {
  const tree = useMaybeMenuTree()
  if (!tree) {
    throw new Error(
      'FocusOwner components must be used within a FocusOwnerProvider',
    )
  }
  return tree.focusOwner
}
