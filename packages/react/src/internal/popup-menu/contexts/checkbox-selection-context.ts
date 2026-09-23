'use client'

import * as React from 'react'
import type { CheckboxSelectionStore } from '../store/CheckboxSelectionStore.js'

const CheckboxSelectionContext =
  React.createContext<CheckboxSelectionStore | null>(null)

/** The surface's checkbox selection store, or `null` outside a surface. */
export function useMaybeCheckboxSelection(): CheckboxSelectionStore | null {
  return React.useContext(CheckboxSelectionContext)
}

/** The surface's checkbox selection store. Throws outside a surface. */
export function useCheckboxSelection(): CheckboxSelectionStore {
  const store = React.useContext(CheckboxSelectionContext)
  if (!store) {
    throw new Error(
      'PopupMenu.CheckboxItem must be used within PopupMenu.Surface',
    )
  }
  return store
}

export { CheckboxSelectionContext }
