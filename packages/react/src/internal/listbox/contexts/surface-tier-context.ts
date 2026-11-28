'use client'

import * as React from 'react'
import type { ListboxStore } from '../store/ListboxStore.js'

// ============================================================================
// Row width queue
// ============================================================================

/** Measures a row's width: its List's (`useStickyRowWidth`). */
export type MeasureRow = (element: HTMLElement, id: string) => void

interface QueuedRow {
  readonly element: HTMLElement
  readonly id: string
}

/**
 * Where a surface's rows queue their width measurements, made with its tier.
 * Each List attaches its measurer (`attach`, with its element; `null` when it
 * doesn't measure) and takes the rows inside it: a row queued before its
 * List attached waits for it, since rows queue from their layout effects,
 * which run before their List's. A waiting row is dropped when it unmounts
 * (the removal `queue` returns), so nothing is kept for a row that's gone.
 */
export class RowWidthQueue {
  readonly #waiting = new Set<QueuedRow>()
  readonly #lists = new Map<Element, MeasureRow | null>()

  /**
   * Queues a row's measurement with the List it's in: now, or once that
   * List attaches. Returns its removal, for the row's cleanup.
   */
  queue(element: HTMLElement, id: string): () => void {
    for (const [list, measure] of this.#lists) {
      if (list.contains(element)) {
        measure?.(element, id)
        return noop
      }
    }
    const row: QueuedRow = { element, id }
    this.#waiting.add(row)
    return () => {
      this.#waiting.delete(row)
    }
  }

  /**
   * Attaches a List's measurer (`null` when it doesn't measure), which takes
   * the waiting rows inside the List; returns its removal, which removes
   * only this List's.
   */
  attach(list: Element, measure: MeasureRow | null): () => void {
    this.#lists.set(list, measure)
    for (const row of [...this.#waiting]) {
      if (!list.contains(row.element)) continue
      this.#waiting.delete(row)
      measure?.(row.element, row.id)
    }
    return () => {
      if (this.#lists.get(list) === measure) this.#lists.delete(list)
    }
  }
}

function noop() {}

// ============================================================================
// Surface Tier
// ============================================================================

/**
 * What one surface's store shares with the parts that render for it, apart
 * from its published contexts (see "Tier contexts" in packages/react/AGENTS.md):
 * its store, its depth, its identity (`surfaceId`) and its rows' width
 * queue. The menu engine's `MenuSurfaceTier` extends it; it lives here so the
 * listbox layer reads it too. Every field is set when it's made and never
 * changes, so its contexts' values never do either.
 */
export class ListboxSurfaceTier {
  /** Where the surface's rows queue their width measurements. */
  readonly rowWidth: RowWidthQueue = new RowWidthQueue()

  constructor(
    /** The surface's store. */
    readonly store: ListboxStore,
    /** The tier around this one: the parent surface's, or an outer menu's. */
    readonly parent: ListboxSurfaceTier | null,
    /** The surface's menu depth: 0 for a root, one more per submenu. */
    readonly depth: number,
    /**
     * The surface's id, for its whole life: its popup's and its Surface's
     * (the published `PopupSurfaceIdContext` and `SurfaceContext` carry it).
     */
    readonly surfaceId: string,
  ) {}
}

/**
 * The tier of the level a part renders in (a root, a submenu or a subpage),
 * provided by the level around everything it renders, its trigger
 * included, where the published `PopupMenuContext` is.
 */
export const SurfaceTierContext =
  React.createContext<ListboxSurfaceTier | null>(null)

/**
 * The tier of the `Surface` a part is mounted in, provided by the Surface
 * around its content, where the published `SurfaceContext` is: `null`
 * outside a Surface. It differs from the level's for a submenu's trigger and
 * anything beside it in its `Submenu`: they're in the submenu's level, and
 * mounted in the surface above.
 */
export const EnclosingSurfaceContext =
  React.createContext<ListboxSurfaceTier | null>(null)

if (process.env.NODE_ENV !== 'production') {
  SurfaceTierContext.displayName = 'SurfaceTierContext'
  EnclosingSurfaceContext.displayName = 'EnclosingSurfaceContext'
}

export function useMaybeSurfaceTier(): ListboxSurfaceTier | null {
  return React.useContext(SurfaceTierContext)
}

/** The tier of the level a part renders in. */
export function useSurfaceTier(): ListboxSurfaceTier {
  const tier = React.useContext(SurfaceTierContext)
  if (!tier) {
    throw new Error('Listbox components must be used within a Listbox provider')
  }
  return tier
}

export function useMaybeEnclosingSurface(): ListboxSurfaceTier | null {
  return React.useContext(EnclosingSurfaceContext)
}

/** The tier of the `Surface` a part is mounted in. */
export function useEnclosingSurface(): ListboxSurfaceTier {
  const tier = React.useContext(EnclosingSurfaceContext)
  if (!tier) {
    throw new Error('Listbox components must be used within a Surface provider')
  }
  return tier
}
