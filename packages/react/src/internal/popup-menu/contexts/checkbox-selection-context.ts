'use client'

import { useMaybeSurfaceContext } from '../../listbox/contexts/surface-context.js'
import type { CheckboxSelectionStore } from '../store/CheckboxSelectionStore.js'
import {
  findSurfaceTier,
  useMaybeMenuSurfaceTier,
} from './surface-tier-context.js'

/**
 * The checkbox selection of the Surface around the caller (its tier's
 * `selection`), or null outside a Surface.
 */
export function useMaybeCheckboxSelection(): CheckboxSelectionStore | null {
  const surface = useMaybeSurfaceContext()
  const tier = findSurfaceTier(useMaybeMenuSurfaceTier(), surface?.store)
  return tier ? tier.selection : null
}

export function useCheckboxSelection(): CheckboxSelectionStore {
  const store = useMaybeCheckboxSelection()
  if (!store) {
    throw new Error(
      'PopupMenu.CheckboxItem must be used within PopupMenu.Surface',
    )
  }
  return store
}
