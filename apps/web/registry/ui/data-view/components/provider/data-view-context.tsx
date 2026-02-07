'use client'

import type {
  Column,
  DataViewInstance,
  FilterModel,
} from '@bazza-ui/data-view/react'
import { createContext, useContext } from 'react'

// ---------------------------------------------------------------------------
// DataView context
// ---------------------------------------------------------------------------

export interface DataViewContextValue {
  instance: DataViewInstance<any, any, any>
  layer: 'overrides' | 'base'
}

const DataViewContext = createContext<DataViewContextValue | null>(null)
DataViewContext.displayName = 'DataViewContext'

export { DataViewContext }

// ---------------------------------------------------------------------------
// DataView accessor hooks
// ---------------------------------------------------------------------------

export function useDataViewContext(): DataViewContextValue {
  const ctx = useContext(DataViewContext)
  if (!ctx) {
    throw new Error(
      'useDataViewContext must be used within a <DataViewProvider>',
    )
  }
  return ctx
}

export function useDataViewInstance(): DataViewInstance<any, any, any> {
  return useDataViewContext().instance
}

export function useDataViewColumns(): Column<any>[] {
  return useDataViewContext().instance.columns
}

export function useDataViewLayer(): 'overrides' | 'base' {
  return useDataViewContext().layer
}

// ---------------------------------------------------------------------------
// Per-filter-item context
// ---------------------------------------------------------------------------

export interface DataViewFilterItemContextValue {
  filter: FilterModel
  column: Column<any>
}

const DataViewFilterItemContext =
  createContext<DataViewFilterItemContextValue | null>(null)
DataViewFilterItemContext.displayName = 'DataViewFilterItemContext'

export { DataViewFilterItemContext }

export function useDataViewFilterItemContext(): DataViewFilterItemContextValue {
  const ctx = useContext(DataViewFilterItemContext)
  if (!ctx) {
    throw new Error(
      'useDataViewFilterItemContext must be used within a DataViewFilterItem provider',
    )
  }
  return ctx
}
