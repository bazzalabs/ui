'use client'

import * as React from 'react'
import type { ListboxStore } from '../store/ListboxStore.js'

/**
 * Marks the rows a data-first list renders from its Collection: in the
 * surface whose store is `store`, a row whose id the Collection `has` binds
 * its element to the store's Data adapter (`bindDataRow`) instead of
 * registering. Any other row (a JSX row the consumer renders next to the
 * data rows, or a submenu's rows, which have a store of their own) registers
 * as usual. Provided once per list, with a stable value, so a new Collection
 * doesn't re-render its rows.
 */
export interface CollectionRowsContextValue {
  store: ListboxStore
  has: (id: string) => boolean
}

export const CollectionRowsContext =
  React.createContext<CollectionRowsContextValue | null>(null)

export function useMaybeCollectionRows(): CollectionRowsContextValue | null {
  return React.useContext(CollectionRowsContext)
}
