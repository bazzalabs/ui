'use client'

import type { Column, ColumnDataType, FilterModel } from '@bazza-ui/filters'
import { X } from 'lucide-react'
import { type ComponentPropsWithoutRef, createContext, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
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

interface FilterBlockContextValue<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
}

const FilterBlockContext = createContext<FilterBlockContextValue | null>(null)

function useFilterBlockContext<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
>(): FilterBlockContextValue<TData, TType> {
  const context = useContext(FilterBlockContext)
  if (!context) {
    throw new Error(
      'FilterBlock compound components must be used within FilterBlock',
    )
  }
  return context as FilterBlockContextValue<TData, TType>
}

export interface FilterBlockProps<TData, TType extends ColumnDataType>
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  children?: React.ReactNode
}

export function FilterBlock<TData, TType extends ColumnDataType>({
  filter,
  column,
  children,
  className,
  ...props
}: FilterBlockProps<TData, TType>) {
  return (
    <FilterBlockContext.Provider
      value={{ filter, column } as FilterBlockContextValue}
    >
      <div
        data-slot="filter-block"
        data-column-id={column.id}
        data-column-type={column.type}
        className={cn(
          'flex h-7 items-center rounded-2xl border border-border bg-background shadow-xs text-xs',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </FilterBlockContext.Provider>
  )
}

export namespace FilterBlock {
  export type Props<TData, TType extends ColumnDataType> = FilterBlockProps<
    TData,
    TType
  >
}

export interface FilterBlockSubjectProps
  extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {}

function Subject(props: FilterBlockSubjectProps = {}) {
  const { column } = useFilterBlockContext()
  const entityName = useFilterEntityName()
  return <FilterSubject column={column} entityName={entityName} {...props} />
}

export interface FilterBlockOperatorProps
  extends Omit<
    ComponentPropsWithoutRef<typeof Button>,
    'onClick' | 'children'
  > {}

function Operator(props: FilterBlockOperatorProps = {}) {
  const { filter, column } = useFilterBlockContext()
  const actions = useFilterActions()
  const locale = useFilterLocale()
  return (
    <FilterOperator
      filter={filter}
      column={column}
      actions={actions}
      locale={locale}
      {...props}
    />
  )
}

export interface FilterBlockValueProps {
  className?: string
}

function Value({ className }: FilterBlockValueProps = {}) {
  const { filter, column } = useFilterBlockContext()
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
      className={className}
    />
  )
}

export interface FilterBlockRemoveProps
  extends Omit<ComponentPropsWithoutRef<typeof Button>, 'onClick' | 'variant'> {
  variant?: ComponentPropsWithoutRef<typeof Button>['variant']
}

function Remove({
  className,
  variant = 'ghost',
  ...props
}: FilterBlockRemoveProps = {}) {
  const { filter } = useFilterBlockContext()
  const actions = useFilterActions()
  return (
    <Button
      data-slot="filter-block-remove"
      variant={variant}
      className={cn(
        'rounded-none rounded-r-2xl text-xs w-7 h-full text-muted-foreground hover:text-primary',
        className,
      )}
      onClick={() => actions.removeFilter(filter.columnId)}
      {...props}
    >
      <X className="size-4" />
    </Button>
  )
}

FilterBlock.Subject = Subject
FilterBlock.Operator = Operator
FilterBlock.Value = Value
FilterBlock.Remove = Remove
