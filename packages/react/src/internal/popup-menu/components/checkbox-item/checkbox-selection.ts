'use client'

import * as React from 'react'
import {
  getPendingRows,
  type ListboxStore,
  setPendingRows,
} from '../../../listbox/store/ListboxStore.js'
import {
  type MenuSurfaceTier,
  useMaybeMenuEnclosingSurface,
} from '../../contexts/surface-tier-context.js'
import { CheckboxSelectionStore } from '../../store/CheckboxSelectionStore.js'

function createSelection(
  store: ListboxStore,
  surfaceRef: { current: HTMLElement | null },
): CheckboxSelectionStore {
  return new CheckboxSelectionStore({
    getVisibleItemIds: () => store.getVisibleItemIds(),
    getItemElement: (id) =>
      store.context.refs.itemRefs.get(id)?.current ?? null,
    getScrollElement: () => {
      const listElement = store.context.refs.listRef.current
      const scrollElement =
        store.context.refs.listScrollContainerRef.current ??
        (listElement ? store.getScrollResetElement(listElement) : null)
      // Never auto-scroll an ancestor outside this surface (the page or an
      // app shell); fall back to the list element itself.
      if (
        scrollElement &&
        surfaceRef.current &&
        !surfaceRef.current.contains(scrollElement)
      ) {
        return listElement
      }
      return scrollElement
    },
    setHighlightedId: (id) => store.setHighlightedId(id, 'pointer'),
    observeOpen: (listener) => store.observe('open', (open) => listener(open)),
    getPreview: () => getPendingRows(store),
    setPreview: (preview) => setPendingRows(store, preview),
  })
}

/**
 * The tier's checkbox selection, made the first time a checkbox row asks
 * (`MenuSurfaceTier.selection`). Call it from an effect or a handler: it
 * writes the tier's selection store, which a render must not.
 */
export function ensureCheckboxSelection(
  tier: MenuSurfaceTier,
): CheckboxSelectionStore {
  const existing = tier.selection.state.current
  if (existing) return existing
  const created = createSelection(tier.store, tier.surfaceRef)
  tier.selection.set('current', created)
  return created
}

/** A checkbox row's way to its surface's checkbox selection. */
export interface CheckboxRowSelection {
  /** The selection, made if it isn't yet: for what changes it. */
  ensure(): CheckboxSelectionStore
  /** The selection if a row has made it, else null: for what only reads it. */
  peek(): CheckboxSelectionStore | null
}

/**
 * A checkbox row's way to its surface's checkbox selection (stable for the
 * surface). Call it from effects and handlers: `ensure()` to change the
 * selection (registering, an anchor, a press, a range), `peek()` to read it,
 * so a row that only reads (a disabled one) never makes it.
 */
export function useCheckboxRowSelection(): CheckboxRowSelection {
  const tier = useMaybeMenuEnclosingSurface()
  if (!tier) {
    throw new Error(
      'PopupMenu.CheckboxItem must be used within PopupMenu.Surface',
    )
  }
  return React.useMemo(
    () => ({
      ensure: () => ensureCheckboxSelection(tier),
      peek: () => tier.selection.state.current,
    }),
    [tier],
  )
}
