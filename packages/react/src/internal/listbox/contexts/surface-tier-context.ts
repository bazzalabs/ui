'use client'

import * as React from 'react'
import type { ListboxStore } from '../store/ListboxStore.js'

// ============================================================================
// Surface Tier
// ============================================================================

/**
 * What one surface's store shares with the parts that render for it, apart
 * from its published contexts (see "Tier contexts" in packages/react/AGENTS.md):
 * its store and its depth. The menu engine's `MenuSurfaceTier` extends it; it
 * lives here so the listbox layer reads it too. Every field is set when it's
 * made and never changes, so its context's value never does either.
 */
export class ListboxSurfaceTier {
  constructor(
    /** The surface's store. */
    readonly store: ListboxStore,
    /** The tier around this one: the parent surface's, or an outer menu's. */
    readonly parent: ListboxSurfaceTier | null,
    /** The surface's menu depth: 0 for a root, one more per submenu. */
    readonly depth: number,
  ) {}
}

export const SurfaceTierContext =
  React.createContext<ListboxSurfaceTier | null>(null)

if (process.env.NODE_ENV !== 'production') {
  SurfaceTierContext.displayName = 'SurfaceTierContext'
}

export function useMaybeSurfaceTier(): ListboxSurfaceTier | null {
  return React.useContext(SurfaceTierContext)
}

/** The tier of the surface a part renders in. */
export function useSurfaceTier(): ListboxSurfaceTier {
  const tier = React.useContext(SurfaceTierContext)
  if (!tier) {
    throw new Error('Listbox components must be used within a Listbox provider')
  }
  return tier
}
