'use client'

import type {
  Column,
  DataTableFilterActions,
  FilterStrategy,
  FiltersState,
  Locale,
} from '@bazza-ui/filters'
import {
  FilterContext,
  type FilterContextValue,
  type FilterVariant,
} from '../root/filter-context'

export interface FilterProviderProps<TData = unknown> {
  columns: Column<TData>[]
  filters: FiltersState
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale?: Locale
  entityName?: string
  variant?: FilterVariant
  children: React.ReactNode
}

export function FilterProvider<TData>({
  columns,
  filters,
  actions,
  strategy,
  locale = 'en',
  entityName,
  variant,
  children,
}: FilterProviderProps<TData>) {
  const contextValue: FilterContextValue<TData> = {
    columns,
    filters,
    actions,
    strategy,
    locale,
    entityName,
    variant,
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
