'use client'

import type {
  Column,
  DataTableFilterActions,
  FilterStrategy,
  FiltersState,
  Locale,
} from '@bazza-ui/filters'
import { FilterContext, type FilterContextValue } from '../root/filter-context'

export interface FilterProviderProps<TData = unknown> {
  columns: Column<TData>[]
  filters: FiltersState
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale?: Locale
  entityName?: string
  children: React.ReactNode
}

export function FilterProvider<TData>({
  columns,
  filters,
  actions,
  strategy,
  locale = 'en',
  entityName,
  children,
}: FilterProviderProps<TData>) {
  const contextValue: FilterContextValue<TData> = {
    columns,
    filters,
    actions,
    strategy,
    locale,
    entityName,
  }

  return (
    <FilterContext.Provider value={contextValue as FilterContextValue}>
      {children}
    </FilterContext.Provider>
  )
}

export namespace FilterProvider {
  export type Props<TData = unknown> = FilterProviderProps<TData>
}
