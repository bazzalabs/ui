'use client'

import type { Column } from '@bazza-ui/filters'
import { useContext, useMemo } from 'react'
import {
  DataTableFilterContext,
  type DataTableFilterContextValue,
} from './provider'

export function useFilterContext<
  TData = unknown,
>(): DataTableFilterContextValue<TData> {
  const context = useContext(DataTableFilterContext)
  if (!context) {
    throw new Error(
      'useFilterContext must be used within a DataTableFilterProvider',
    )
  }
  return context as DataTableFilterContextValue<TData>
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
