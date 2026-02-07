'use client'

import type { DataViewInstance } from '@bazza-ui/data-view/react'

import { DataViewContext } from './data-view-context'

// ---------------------------------------------------------------------------
// DataViewProvider
// ---------------------------------------------------------------------------

export interface DataViewProviderProps {
  instance: DataViewInstance<any, any, any>
  /** Which layer filter/sort mutations target. @default 'overrides' */
  layer?: 'overrides' | 'base'
  children: React.ReactNode
}

export function DataViewProvider({
  instance,
  layer = 'overrides',
  children,
}: DataViewProviderProps) {
  return (
    <DataViewContext.Provider value={{ instance, layer }}>
      {children}
    </DataViewContext.Provider>
  )
}
