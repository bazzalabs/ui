'use client'

import type {
  Column,
  DataTableFilterActions,
  FilterStrategy,
  FiltersState,
  Locale,
} from '@bazza-ui/filters'
import { createContext, useContext, useMemo } from 'react'

export type FilterVariant = 'default' | 'clean'

export interface FilterContextValue<TData = unknown> {
  columns: Column<TData>[]
  filters: FiltersState
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale: Locale
  entityName?: string
  variant?: FilterVariant
}

export const FilterContext = createContext<FilterContextValue | null>(null)

export function useFilterContext<TData = unknown>(): FilterContextValue<TData> {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error('useFilterContext must be used within a FilterProvider')
  }
  return context as FilterContextValue<TData>
}

export function useFilterColumn<TData = unknown>(
  columnId: string,
): Column<TData> | undefined {
  const { columns } = useFilterContext<TData>()
  return useMemo(
    () => columns.find((col) => col.id === columnId),
    [columns, columnId],
  )
}

export function useFilterActions() {
  const { actions } = useFilterContext()
  return actions
}

export function useFilterStrategy() {
  const { strategy } = useFilterContext()
  return strategy
}

export function useFilterLocale() {
  const { locale } = useFilterContext()
  return locale
}

export function useFilterEntityName() {
  const { entityName } = useFilterContext()
  return entityName
}

export function useFilterVariant() {
  const { variant } = useFilterContext()
  return variant
}

export namespace FilterContext {
  export type Value<TData = unknown> = FilterContextValue<TData>
}
