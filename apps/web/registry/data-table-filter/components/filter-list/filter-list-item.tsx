'use client'

import type { Column, ColumnDataType, FilterModel } from '@bazza-ui/filters'
import { X } from 'lucide-react'
import { createContext, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  useFilterActions,
  useFilterContext,
  useFilterEntityName,
  useFilterLocale,
  useFilterStrategy,
} from '../../context'
import { FilterOperator } from '../filter-operator'
import { FilterSubject } from '../filter-subject'
import { FilterValue } from '../filter-value'

interface FilterListItemContextValue<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
}

const FilterListItemContext = createContext<FilterListItemContextValue | null>(
  null,
)

function useFilterListItemContext<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
>(): FilterListItemContextValue<TData, TType> {
  const context = useContext(FilterListItemContext)
  if (!context) {
    throw new Error(
      'FilterListItem compound components must be used within FilterListItem',
    )
  }
  return context as FilterListItemContextValue<TData, TType>
}

export interface FilterListItemProps<TData, TType extends ColumnDataType> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  children?: React.ReactNode
}

export function FilterListItem<TData, TType extends ColumnDataType>({
  filter,
  column,
  children,
}: FilterListItemProps<TData, TType>) {
  return (
    <FilterListItemContext.Provider
      value={{ filter, column } as FilterListItemContextValue}
    >
      <div className="flex h-7 items-center rounded-2xl border border-border bg-background shadow-xs text-xs">
        {children}
      </div>
    </FilterListItemContext.Provider>
  )
}

export namespace FilterListItem {
  export type Props<TData, TType extends ColumnDataType> = FilterListItemProps<
    TData,
    TType
  >
}

function Subject() {
  const { column } = useFilterListItemContext()
  const entityName = useFilterEntityName()
  return <FilterSubject column={column} entityName={entityName} />
}

function Operator() {
  const { filter, column } = useFilterListItemContext()
  const actions = useFilterActions()
  const locale = useFilterLocale()
  return (
    <FilterOperator
      filter={filter}
      column={column}
      actions={actions}
      locale={locale}
    />
  )
}

function Value() {
  const { filter, column } = useFilterListItemContext()
  const actions = useFilterActions()
  const strategy = useFilterStrategy()
  const locale = useFilterLocale()
  const entityName = useFilterEntityName()
  return (
    <FilterValue
      filter={filter}
      column={column}
      actions={actions}
      strategy={strategy}
      locale={locale}
      entityName={entityName}
    />
  )
}

function Remove() {
  const { filter } = useFilterListItemContext()
  const actions = useFilterActions()
  return (
    <Button
      variant="ghost"
      className="rounded-none rounded-r-2xl text-xs w-7 h-full text-muted-foreground hover:text-primary"
      onClick={() => actions.removeFilter(filter.columnId)}
    >
      <X className="size-4 -translate-x-0.5" />
    </Button>
  )
}

FilterListItem.Subject = Subject
FilterListItem.Operator = Operator
FilterListItem.Value = Value
FilterListItem.Remove = Remove
