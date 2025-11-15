'use client'

import type {
  Column,
  DataTableFilterActions,
  FilterStrategy,
  FiltersState,
  Locale,
} from '@bazza-ui/filters'
import { createContext } from 'react'

export type FilterVariant = 'default' | 'clean'

export interface DataTableFilterContextValue<TData = unknown> {
  columns: Column<TData>[]
  filters: FiltersState
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale: Locale
  entityName?: string
  variant?: FilterVariant
}

export const DataTableFilterContext =
  createContext<DataTableFilterContextValue | null>(null)

export interface DataTableFilterProviderProps<TData = unknown> {
  value: DataTableFilterContextValue<TData>
  children: React.ReactNode
}

export function DataTableFilterProvider<TData>({
  value,
  children,
}: DataTableFilterProviderProps<TData>) {
  return (
    <DataTableFilterContext.Provider
      value={value as DataTableFilterContextValue}
    >
      {children}
    </DataTableFilterContext.Provider>
  )
}
