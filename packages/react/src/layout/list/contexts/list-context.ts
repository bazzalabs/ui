'use client'

import * as React from 'react'
import type { ListColumn } from '../index.js'
import type { ListStore, SelectionMode } from '../store/use-list-store.js'

export interface ListContextValue {
  store: ListStore<unknown>
  layout: boolean
  columns: readonly ListColumn[] | undefined
  rootId: string
  rootRef: React.RefObject<HTMLElement | null>
  selectionMode: SelectionMode
  empty: boolean
  firstNavigableKey: string | null
}

const ListContext = React.createContext<ListContextValue | null>(null)

export function useListContext(): ListContextValue {
  const context = React.useContext(ListContext)
  if (!context)
    throw new Error('List components must be used within a List.Root')
  return context
}

export { ListContext }
