'use client'

import type {
  Column,
  DataViewInstance,
  FilterStrategy,
  FiltersState,
  Locale,
  SortState,
  ViewLayer,
} from '@bazza-ui/data-view/react'
import { createContext, useContext, useMemo } from 'react'

export type DataViewVariant = 'default' | 'clean'

export interface DataViewContextValue<TData = unknown> {
  instance: DataViewInstance<TData, any, any>
  columns: Column<TData>[]
  filters: FiltersState
  sort: SortState
  layer: ViewLayer<TData>
  strategy: FilterStrategy
  locale: Locale
  entityName?: string
  variant?: DataViewVariant
}

export const DataViewContext = createContext<DataViewContextValue | null>(null)

export function useDataViewContext<
  TData = unknown,
>(): DataViewContextValue<TData> {
  const context = useContext(DataViewContext)
  if (!context) {
    throw new Error('useDataViewContext must be used within a DataViewProvider')
  }
  return context as DataViewContextValue<TData>
}

export function useDataViewInstance<TData = unknown>() {
  const { instance } = useDataViewContext<TData>()
  return instance
}

export function useDataViewColumns<TData = unknown>() {
  const { columns } = useDataViewContext<TData>()
  return columns
}

export function useDataViewColumn<TData = unknown>(
  columnId: string,
): Column<TData> | undefined {
  const { columns } = useDataViewContext<TData>()
  return useMemo(
    () => columns.find((col) => col.id === columnId),
    [columns, columnId],
  )
}

export function useDataViewLayer<TData = unknown>() {
  const { layer } = useDataViewContext<TData>()
  return layer
}

export function useDataViewFilters() {
  const { filters } = useDataViewContext()
  return filters
}

export function useDataViewSort() {
  const { sort } = useDataViewContext()
  return sort
}

export function useDataViewStrategy() {
  const { strategy } = useDataViewContext()
  return strategy
}

export function useDataViewLocale() {
  const { locale } = useDataViewContext()
  return locale
}

export function useDataViewEntityName() {
  const { entityName } = useDataViewContext()
  return entityName
}

export function useDataViewVariant() {
  const { variant } = useDataViewContext()
  return variant
}

export namespace DataViewContext {
  export type Value<TData = unknown> = DataViewContextValue<TData>
}
