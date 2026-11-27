'use client'

import type { FocusZoneRegistry } from '../store/FocusZoneRegistry.js'
import { useMaybeMenuTreeTier } from './menu-tree-context.js'

/** The menu tree's focus zones (its tree tier's), or null outside one. */
export function useMaybeFocusZoneRegistry(): FocusZoneRegistry | null {
  return useMaybeMenuTreeTier()?.focusZones ?? null
}
